# Hakuapuri

Käytä sanastoja tarkan haun apuna.

Hakuapuri on liitännäinen, joka ehdottaa Finton sanastoista termejä suoraan kuvailijan
hakukenttään. Liitännäinen toimii virkailijaliittymässä tarkan haun sivulla
(`/cgi-bin/koha/catalogue/search.pl`) ja auttaa hakemaan YSO-sanaston termejä myös
paikallisten kantojen ja Tätin hakuun.

Versio 1.0.0, vaatii vähintään Kohan version 24.05. Liitännäisen nimi ja kuvaus ovat
käännetyt: suomeksi *IntranetUserJS: Hakuapuri*, ruotsiksi *IntranetUserJS: Sökassistent*
ja englanniksi *IntranetUserJS: Search assistant*.

## Mitä liitännäinen tekee

Kun kuvailija tai tiedonhakija kirjoittaa tarkan haun hakukenttään vähintään kolme merkkiä, liitännäinen
hakee Finton sanasto-API:sta hakusanan alkeen vastaavat termit ja näyttää ne listana
hakukentän alla. Kuvailija tai tiedonhakija valitsee listasta sopivan termin, ja se siirtyy hakukenttään.

Liitännäinen **ei muuta itse hakua**. Se täyttää vain hakukentän, joten:

* hakukenttään valittu hakutyyppi (Nimeke, Tekijä, Asiasana, Luokka, Hakusana tms.) pysyy
  entisenään,
* haku tehdään tavanomaisena Kohan hakuna eikä sitä rajoiteta sanaston ehdoilla,
* liitännäinen ei lisää tuloksiin mitään ja ei vaikuta hakutulosten määrään.

Sanasto tarjoaa siis vain apua oikean termin löytämiseen. Sanaston sisällöstä ja sen
rajoituksista (esimerkiksi luokitussanastojen kohdalla) vastaa Finto, ei liitännäinen.

Hakutermi lähetetään selaimesta suoraan Finton rajapintaan (`https://api.finto.fi`).

## Käyttö

1. Mene tarkan hakuun (Haku -> Tarkka haku).
2. Kirjoita hakukenttään vähintään kolme merkkiä. Odotetaan hetki, jonka jälkeen ehdotukset
   näkyvät hakukentän alla.
3. Valitse termi joko klikkaamalla sitä tai näppäimistä: nuolet ylös/alas siirtävät
   valintaa, **Enter** siirtää valitun termin hakukenttään ja **Esc** tai **Tab** sulkee
   ehdotuslistan.

Ehdotuksia näytetään enintään kymmenen kappaletta. `[+]`-napilla lisätyt uudet hakukentät
saavat omat ehdotuksensa, joten ehdotuksia voi käyttää myös moniosaisissa hauissa.

Vinkki: ehdotukset syntyvät hakusanan alkeen, joten kirjoita hakusanan alku, vaikka
et tiedäkään sanastossa käytettävää kirjoitusmuotoa. Esimerkiksi `kirj` voi tuottaa
ehdotuksia, vaikka itse hakusana olisi `kirjakauppa`.

## Asetukset

Asetus löytyy liitännäisen määrittelynä sivulta **Liitännäiset → IntranetUserJS: Hakuapuri →
Konfiguraatio**. Asetus on liitännäisen eli koko Kohan laajuinen, ei kirjastokohtainen, ja
se koskee kaikkia liitännäisen käyttäjiä.

| Asetus | Kuvaus |
|---|---|
| Sanastot | Sanastojen tunnukset välilyönnillä eroteltuna, esim. `yso allars finaf` |

Asetussivun ohjeteksti kertoo saman: "välilyönnillä eroteltu lista sanastoista". Jos
asetusta ei ole tallennettu, käytetään oletusta `yso finaf`.

Sanastojen tunnukset löytyvät Finto-palvelusta: avaa sanaston sivu osoitteessa
`https://finto.fi/<tunnus>/fi/`. Esimerkiksi YSO on `https://finto.fi/yso/fi/`. Tarkista
myös, onko sanasto käytettävissä suomeksi, eli onko sen kieli `fi` vai `sv` tai `en`.

| Tunnus | Sanasto |
|---|---|
| `yso` | Yleisimmät suomalaiset aineistotyypit ja -muodot |
| `finaf` | Henkilö- ja yhteisönimet (Asteri) |
| `allars` | Henkilö- ja yhteisönimet (Allärs) |
| `seko` | SEKO, tieteen käsitteet |
| `ykl` | Yleisten kirjastojen luokitusjärjestelmä |
| `kauno` | Kaunokirjallisuuden aineistotyypit |
| `slm` | Suomen laulu-ja musiikkiaineistot |
| `ysopaikat` | Maantieteelliset paikat, suomalaiset ja kansainväliset |
| `yso-aika` | Aikakaudet ja -jaksot |

Luokitussanastot kuten `ykl` laajentavat hakusanan luokkahierarkian termeiksi, jolloin
ehdotuksia tulee paljon ja ne ovat keskenään päällekkäisiä: esimerkiksi kysymys `42*`
sanastosta `ykl` palauttaa 81 käsitettä. Lisäksi luokitussanastojen termit voivat olla
sanaston omalla kielellä, vaikka haku tehtäisiin suomeksi. Kokemuksia YKL-sanaston
käytöstä hakuapurina on kerätty tikettiin
[Koha #2317](https://github.com/KohaSuomi/Koha/issues/2317).

## Miten se toimii

Liitännäinen lisää kuvailijan tai tiedonhakija selaimen sivustolle oman JavaScript-tiedostonsa
(`Koha/Plugin/Fi/KohaSuomi/SearchHelpers/js/finto-helper.js`) kaikille virkailijaliittymän
sivuille, mutta ehdotukset toimivat vain tarkan haun sivulla, koska sivulta löytyvä
`<fieldset id="searchterms">` -elementti on tarkan haun sivulla. Nidehakuun, kuvailijan
muihin näkymiin tai OPACiin liitännäinen ei vaikuta.

Tapahtumat:

1. Kirjoitettaessa kenttään odotetaan 400 ms, jotta ehdotuksia ei haeta joka merkillä.
2. Alle kolmen merkin pituisella hakusanalla ei haeta lainkaan.
3. Kysely lähetetään Finton rajapintaan muodossa
   `https://api.finto.fi/rest/v1/search?vocab=<sanastot>&query=<hakusana>*`. Hakusanan lopussa
   oleva `*` tekee hausta alkusana-hakun.
4. Tuloksista otetaan enintään kymmenen eri termiä. Termi valitaan tuloksen `label`-,
   `prefLabel`- tai `localname`-kentästä tässä järjestyksessä. Finton rajapinta palauttaa
   termin yleensä `prefLabel`-kentässä, joten ehdotuksena näkyy sanaston oma termi. Jos
   sanasto ei palauta termiä lainkaan, näytetään sanaston käsitteen tunnus
   (`localname`-kenttä, esimerkiksi `p156`).
5. Termistä poistetaan turhat loput: otetaan vain ensimmäiset kaksi pilkullista osaa ja
   lopusta poistetaan vuosiluvut, jotta esimerkiksi `Kari, Jukka, 1999-` ehdotuksena on
   `Kari, Jukka`.

Liitännäinen ei välitä mitään tietoa takaisin Kohaan, eikä se tee omia kyselyjä
Kohan tietokantaan tai Elasticsearchiin.

## Rajoitteet

* Toimii vain virkailijaliittymän tarkan haun sivulla. Se ei auta nidehauissa, kuvailijan
  tietueen perustiedoissa eikä OPACissa.
* Ehdotukset ovat niin hyviä kuin sanasto, josta ne tulevat. Liitännäinen ei osaa hakea
  Finton ulkopuolelta eikä yhdistää tuloksia Kohan sanastoihin.
* Liitännäisen toiminta riippuu Finton rajapinnan saatavuudesta. Jos ehdotuksia ei tule,
  kannattaa tarkistaa ensin verkkoyhteys rajapintaan.
* Liitännäinen hakee Finton rajapinnasta selaimen kautta, joten hakuun kirjoitettu teksti
  lähtee kuvailijalta ulkoiseen palveluun. Tietosuunnittelussa tämä on huomioitava.

## Testaus

1. Aseta Sanastot-asetukseen esimerkiksi `yso finaf` ja tallenna.
2. Mene tarkkaan hakuun ja kirjoita hakukenttään vähintään kolme merkkiä, esim. `kirj`.
   Ehdotuslistan pitää ilmestyä hakukentän alle.
3. Valitse ehdotus näppäimistä (nuolet ja Enter) ja tarkista, että termi siirtyy
   hakukenttään ja että haku toimii.
4. Toista sama `[+]`-napilla lisätyllä hakukentällä.
5. Tarkista, että Esc sulkee ehdotuslistan ja että kahdella merkillä ei haeta lainkaan.
6. Kirjaudu ulos kirjautumattomaksi käyttäjäksi ja varmista, ettei liitännäinen vaikuta
   OPACiin.

## Tiedostot

| Tiedosto | Sisältö |
|---|---|
| `Koha/Plugin/Fi/KohaSuomi/SearchHelpers.pm` | Liitännäisen metatiedot, käännetyt nimet ja kuvaukset, JavaScriptin lisäys ja asetukset |
| `Koha/Plugin/Fi/KohaSuomi/SearchHelpers/configure.tt` | Asetussivun ulkoasu |
| `Koha/Plugin/Fi/KohaSuomi/SearchHelpers/i18n/*.inc` | Asetussivun käännökset (`default`, `fi-FI`, `sv-SE`) |
| `Koha/Plugin/Fi/KohaSuomi/SearchHelpers/js/finto-helper.js` | Ehdotusten haku ja näyttäminen |

## Asennus

Kohan liitännäisjärjestelmä on kytkettävä päälle koha-confiin
(`<enable_plugins>1</enable_plugins>`) sekä otettava käyttöön `UseKohaPlugins`-asetuksella.
Liitännäinen asennetaan KPZ-paketilla Liitännäiset-sivulta, ja uusimmat paketit löytyvät
repositorion [releases-sivulta](https://github.com/KohaSuomi/koha-plugin-intranetjs-search-helpers/releases).

Asennuksen jälkeen liitännäinen otetaan käyttöön Liitännäiset-sivulta kytkemällä **Käytössä -valinta** päälle. Lähdekoodin asennuksessa `create-symlinks.sh` jättää liitännäisen oletuksena pois käytöstä, jotta se ei ole käytössä kaikissa ympäristöissä vahingossa. Paketin muodostamiseen voi käyttää `deploy.sh`-skriptiä.

## Lisätiedot

* Liitännäinen on lisensoitu GPLv3 -lisenssillä, katso `LICENSE`.
* Finton sanastot ja rajapinta: [finto.fi](https://finto.fi/), rajapinnan osoite on
  `https://api.finto.fi` ja rajapintaa kuvaa sivu
  [Finto API](https://finto.fi/en/api).
* Fintossa käytettävät liitännäiset kuvailussa on kuvattu sivulla
  [Finto-liitännäiset](https://koha-suomi.fi/dokumentaatio/finto/).

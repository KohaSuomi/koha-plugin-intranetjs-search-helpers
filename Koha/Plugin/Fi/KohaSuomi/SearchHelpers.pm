package Koha::Plugin::Fi::KohaSuomi::SearchHelpers;

## It's good practice to use Modern::Perl
use Modern::Perl;

## Required for all plugins
use base qw(Koha::Plugins::Base);
## We will also need to include any Koha libraries we want to access
use C4::Context;
use utf8;
use File::Slurp;

## Here we set our plugin version
our $VERSION = "1.0.0";

## Here is our metadata, some keys are required, some are optional
our $metadata = {
    name            => "IntranetUserJS: Hakuapuri",
    author          => 'Johanna Räisä',
    date_authored   => '2025-06-24',
    date_updated    => '2025-06-24',
    minimum_version => '24.05',
    maximum_version => '',
    version         => $VERSION,
    description     => "Ehdota sanastotermejä tarkassa haussa (Paikalliskannat ja Täti)",
};

## This is the minimum code required for a plugin's 'new' method
## More can be added, but none should be removed
sub new {
    my ( $class, $args ) = @_;

    ## We need to add our metadata here so our base class can access it
    $args->{'metadata'} = $metadata;
    $args->{'metadata'}->{'class'} = $class;

    ## Here, we call the 'new' method for our base class
    ## This runs some additional magic and checking
    ## and returns our actual 
    my $self = $class->SUPER::new($args);

    return $self;
}

## If your plugin needs to add some javascript in the staff intranet, you'll want
## to return that javascript here. Don't forget to wrap your javascript in
## <script> tags. By not adding them automatically for you, you'll have a
## chance to include other javascript files if necessary.
sub intranet_js {
    my ( $self, $args ) = @_;

    my $pluginpath = $self->get_plugin_http_path();
    my $vocab_config = $self->retrieve_data('vocab_config') || '';
    my $scripts = '<script>var vocab_config = "'.$vocab_config.'";</script>';
    $scripts .= '<script src="'.$pluginpath.'/js/finto-helper.js"></script>';
    return $scripts;
}

## If your tool is complicated enough to needs it's own setting/configuration
## you will want to add a 'configure' method to your plugin like so.
## Here I am throwing all the logic into the 'configure' method, but it could
## be split up like the 'report' method is.
sub configure {
    my ( $self, $args ) = @_;
    my $cgi = $self->{'cgi'};

    unless ( $cgi->param('save') ) {
        my $template = $self->get_template({ file => 'configure.tt' });

        ## Grab the values we already have for our settings, if any exist
        $template->param(
            vocab_config => $self->retrieve_data('vocab_config') || {},
        );

        $self->output_html( $template->output() );
    }
    else {
        $self->store_data(
            {
                vocab_config => $cgi->param('vocab_config') || '',
            }
        );
        $self->go_home();
    }
}

## This is the 'install' method. Any database tables or other setup that should
## be done when the plugin if first installed should be executed in this method.
## The installation method should always return true if the installation succeeded
## or false if it failed.
sub install() {
    my ( $self, $args ) = @_;
    
    $self->store_data(
        {
            type => 'intranetUserJs',
        }
    );

    return 1;
}

## This is the 'upgrade' method. It will be triggered when a newer version of a
## plugin is installed over an existing older version of a plugin
sub upgrade {
    my ( $self, $args ) = @_;

    return 1;
}

## This method will be run just before the plugin files are deleted
## when a plugin is uninstalled. It is good practice to clean up
## after ourselves!
sub uninstall() {
    my ( $self, $args ) = @_;

    return 1;
}

1;


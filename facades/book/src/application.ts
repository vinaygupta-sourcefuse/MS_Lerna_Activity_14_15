import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import {AuthorizationComponent} from 'loopback4-authorization';
import {AuthenticationComponent, Strategies} from 'loopback4-authentication';
import {BearerTokenVerifyProvider} from './provider/bearer-token-verify.provider';

export {ApplicationConfig};

export class BookApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);


     //Authentication:
     this.component(AuthenticationComponent);
     this.bind(Strategies.Passport.BEARER_TOKEN_VERIFIER).toProvider(
       BearerTokenVerifyProvider,
     );
 
     //Authorization:
     this.bind('sf.userAuthorization.config').to({});
     this.component(AuthorizationComponent);


    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
}

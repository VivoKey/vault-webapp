import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CryptoService } from 'jslib/abstractions/crypto.service';
import { EnvironmentService } from 'jslib/abstractions/environment.service';
import { I18nService } from 'jslib/abstractions/i18n.service';
import { MessagingService } from 'jslib/abstractions/messaging.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';
import { StateService } from 'jslib/abstractions/state.service';
import { StorageService } from 'jslib/abstractions/storage.service';
import { UserService } from 'jslib/abstractions/user.service';
import { ConsumeOIDCService } from '../services/consumeoidc.service';
import { UrlHelperService } from '../services/url-helper.service';
import { VaultTimeoutService } from 'jslib/abstractions/vaultTimeout.service';
import { RouterService } from '../services/router.service';

import { LockComponent as BaseLockComponent } from 'jslib/angular/components/lock.component';

@Component({
    selector: 'app-lock',
    templateUrl: 'lock.component.html',
})
export class LockComponent extends BaseLockComponent {
    constructor(router: Router, i18nService: I18nService,
        platformUtilsService: PlatformUtilsService, messagingService: MessagingService,
        userService: UserService, cryptoService: CryptoService, private urlHelper: UrlHelperService,
        storageService: StorageService, vaultTimeoutService: VaultTimeoutService, private consumeOIDCService: ConsumeOIDCService,
        environmentService: EnvironmentService, private routerService: RouterService,
        stateService: StateService, private route: ActivatedRoute) {
        super(router, i18nService, platformUtilsService, messagingService, userService, cryptoService,
            storageService, vaultTimeoutService, environmentService, stateService);
    }
    oidccode: string;
    oidcinfo: any;

    async ngOnInit() {
        
        const qParams = this.urlHelper.getHashFragmentParams();
        if (qParams.code != null) {
            this.oidccode = qParams.code;
        }

        await super.ngOnInit();

        if (this.oidccode != null) {
            this.oidcinfo = await this.consumeOIDCService.getUserInfo(this.oidccode);
            this.masterPassword = this.oidcinfo.passwd;
            super.submit();
        }
        const authed = await this.userService.isAuthenticated();
        if (!authed) {
            this.router.navigate(['/']);
        } else if (await this.cryptoService.hasKey()) {
            this.router.navigate(['vault']);
        }

        this.onSuccessfulSubmit = () => {
            const previousUrl = this.routerService.getPreviousUrl();
            if (previousUrl !== '/' && previousUrl.indexOf('lock') === -1) {
                this.successRoute = previousUrl;
            }
            this.router.navigate([this.successRoute]);
        };
    }
    async ngAfterViewOnInit() {
        const qParams = this.urlHelper.getHashFragmentParams();
        if (qParams.code != null) {
            this.oidccode = qParams.code;
        }
        if (this.oidccode != null) {
            this.oidcinfo = await this.consumeOIDCService.getUserInfo(this.oidccode);
            this.masterPassword = this.oidcinfo.passwd;
            super.submit();
        }
    }
}

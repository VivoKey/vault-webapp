import { Component } from '@angular/core';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';

import { ApiService } from 'jslib/abstractions/api.service';
import { AuthService } from 'jslib/abstractions/auth.service';
import { CryptoService } from 'jslib/abstractions/crypto.service';
import { I18nService } from 'jslib/abstractions/i18n.service';
import { PasswordGenerationService } from 'jslib/abstractions/passwordGeneration.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';
import { PolicyService } from 'jslib/abstractions/policy.service';
import { StateService } from 'jslib/abstractions/state.service';
import { ConsumeOIDCService } from '../services/consumeoidc.service';
import { RegisterComponent as BaseRegisterComponent } from 'jslib/angular/components/register.component';
import { UrlHelperService } from '../services/url-helper.service';
import { MasterPasswordPolicyOptions } from 'jslib/models/domain/masterPasswordPolicyOptions';
import { Policy } from 'jslib/models/domain/policy';

import { PolicyData } from 'jslib/models/data/policyData';

@Component({
    selector: 'app-register',
    templateUrl: 'register.component.html',
    providers: [ConsumeOIDCService]
})
export class RegisterComponent extends BaseRegisterComponent {
    showCreateOrgMessage = false;
    showTerms = true;
    oidcstate: string;
    oidccode: string;
    oidcauth: any;
    oidcinfo: any;
    new: string;

    oidcservice: ConsumeOIDCService;
    enforcedPolicyOptions: MasterPasswordPolicyOptions;

    private policies: Policy[];

    constructor(authService: AuthService, router: Router,
        i18nService: I18nService, cryptoService: CryptoService,
        apiService: ApiService, private route: ActivatedRoute, private urlHelper: UrlHelperService,
        stateService: StateService, platformUtilsService: PlatformUtilsService,
        passwordGenerationService: PasswordGenerationService, private policyService: PolicyService, private consumeOIDCService: ConsumeOIDCService) {
        super(authService, router, i18nService, cryptoService, apiService, stateService, platformUtilsService,
            passwordGenerationService);
        this.oidcservice = consumeOIDCService;
        this.showTerms = !platformUtilsService.isSelfHost();
    }

    async ngOnInit() {
        const qParams = this.urlHelper.getHashFragmentParams();
        if (qParams.email != null && qParams.email.indexOf('@') > -1) {
            this.email = qParams.email;
        }
        if (qParams.premium != null) {
            this.stateService.save('loginRedirect', { route: '/settings/premium' });
        } else if (qParams.org != null) {
            this.showCreateOrgMessage = true;
            this.stateService.save('loginRedirect',
                { route: '/settings/create-organization', qParams: { plan: qParams.org } });
        }

        if (qParams.state != null) {
            this.oidcstate = qParams.state;
            
        }
        if (qParams.code != null) {
            this.oidccode = qParams.code;
        }
        
        if (this.oidcstate == "login") {
            this.oidcinfo = await this.consumeOIDCService.getUserInfo(this.oidccode);
            if (this.oidcinfo.new == "True") {
                this.oidcstate = "register";
            }
            else if (this.oidcinfo.new == "False") {               
                this.router.navigate(['login'], { state: { email: this.oidcinfo.email, passwd: this.oidcinfo.passwd }, queryParams: { state: "login_redir" } });
                
            }
        }

        const invite = await this.stateService.get<any>('orgInvitation');
        if (invite != null) {
            try {
                const policies = await this.apiService.getPoliciesByToken(invite.organizationId, invite.token,
                    invite.email, invite.organizationUserId);
                if (policies.data != null) {
                    const policiesData = policies.data.map((p) => new PolicyData(p));
                    this.policies = policiesData.map((p) => new Policy(p));
                }
            } catch { }
        }

        if (this.policies != null) {
            this.enforcedPolicyOptions = await this.policyService.getMasterPasswordPolicyOptions(this.policies);
        }
    }


    async ngAfterViewInit() {
        if (this.oidcstate == "register") {
            this.name = this.oidcinfo.name;
            this.email = this.oidcinfo.email;
            this.masterPassword = this.oidcinfo.passwd;
            this.confirmMasterPassword = this.oidcinfo.passwd;
            super.submit();
        }
        
        
    }
    async submit() {
        super.submit();
    }
    


}


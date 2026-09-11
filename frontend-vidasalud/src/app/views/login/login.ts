import { Component } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  constructor(private authService: MsalService) {}

  login(): void {
    console.log('--> El evento clic funciona correctamente');
    
    this.authService.loginRedirect({
      scopes: ['user.read']
    });
  }
}
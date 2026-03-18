import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar.component';
import { FooterComponent } from './shared/components/footer.component';

@Component({
  imports: [RouterModule, NavbarComponent, FooterComponent],
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {}

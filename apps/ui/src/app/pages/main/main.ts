import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Header } from '../components/header/header';

@Component({
  selector: 'app-main',
  imports: [RouterModule, Header],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main {

}

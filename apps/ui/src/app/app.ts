import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Message } from '@smart-vacation-planner/shared-types';

@Component({
  selector: 'app-root',
  imports: [RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('ui');
  constructor() {
    const message: Message = {
      title: 'Hello',
      content: 'World',
      createdAt: new Date()
    }
    console.log(message);
  }
}

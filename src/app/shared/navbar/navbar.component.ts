import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  @Input() isLoggedIn: boolean = false;
  @Input() username: string = '';
  @Output() logout = new EventEmitter<void>();  

  constructor() { }

  ngOnInit(): void {
  }

  onLogout(): void {
    this.logout.emit();
  }
}

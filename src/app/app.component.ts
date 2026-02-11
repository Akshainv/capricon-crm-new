// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'capricorn-crm';

  constructor(private themeService: ThemeService) {
    // Theme service will automatically initialize and load saved theme
    console.log('🎨 Theme Service Initialized');
  }

  ngOnInit(): void {
    // Log current theme on app initialization
    console.log('Current Theme:', this.themeService.getCurrentTheme());
    
    // Subscribe to theme changes (optional - for debugging)
    this.themeService.theme$.subscribe(theme => {
      console.log('Theme changed to:', theme);
    });
  }
}
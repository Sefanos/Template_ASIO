import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
 
import { Router, RouterModule } from '@angular/router';   
import { LayoutComponent } from './layout.component';
 

@NgModule({
  declarations: [
    LayoutComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ]

})
export class LayoutModule {

  constructor(private router: Router) {}

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }
 }

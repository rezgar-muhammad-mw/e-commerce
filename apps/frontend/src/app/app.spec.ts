import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { App } from './app';
import { Component } from '@angular/core';

@Component({ selector: 'app-navbar', standalone: true, template: '' })
class MockNavbarComponent {}

@Component({ selector: 'app-footer', standalone: true, template: '' })
class MockFooterComponent {}

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, RouterModule.forRoot([])],
    })
      .overrideComponent(App, {
        remove: { imports: [] },
        add: { imports: [RouterModule, MockNavbarComponent, MockFooterComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

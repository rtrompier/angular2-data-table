import { Component } from '@angular/core';
// import { Observable } from 'rx/Observable';
import '../themes/material.scss';

@Component({
  selector: 'app',
  template: `
    <div>
      <h3>basic: fixed row height</h3>
      <datatable
        class="material striped"
        [rows]="rows"
        [columnMode]="'force'"
        [columns]="[ {prop: 'name'}, {name: 'Company'}, {name: 'Gender'} ]"
        [headerHeight]="50"
        [footerHeight]="50"
        [rowHeight]="50"
        [selected]="selected">
      </datatable>
    </div>
  `
})
export class App {

  rows: any[] = [];
  selected = [];

  constructor() {
    this.fetch((data) => {
      this.rows = data;
    });
  }

  fetch(cb) {
    const req = new XMLHttpRequest();
    req.open('GET', `assets/data/company.json`);

    req.onload = () => {
      cb(JSON.parse(req.response));
    };

    req.send();
  }

}

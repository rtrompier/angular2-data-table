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
        [columns]="columns"
        [headerHeight]="50"
        [footerHeight]="50"
        [rowHeight]="50"
        [selected]="selected"
        [selectionType]="'cell'"
        (select)="onSelect($event)"
        (activate)="onActivate($event)">
      </datatable>
    </div>
  `
})
export class App {

  rows: any[] = [];
  selected: any[] = [];
  columns: any[] = [
    { prop: 'name'} , 
    { name: 'Company' }, 
    { name: 'Gender' }
  ];

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

  onSelect(event) {
    console.log('Event: select', event, this.selected);
  }

  onActivate(event) {
    console.log('Event: activate', event);
  }

}

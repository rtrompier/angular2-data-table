import { NgModule, ApplicationRef } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { removeNgStyles, createNewHosts } from '@angularclass/hmr';

import { Angular2DataTableModule } from '../src';
import '../src/components/datatable.scss';
import '../src/themes/material.scss';

// -- Basic
// import { App } from './basic-fixed';
// import { App } from './basic-auto';
// import { App } from './virtual';
// import { App } from './inline';
// import { App } from './scrolling';
import { App } from './basic/multiple';
// import { App } from './basic/fullscreen';
// import { App } from './basic/row-detail';

// -- Paging
// import { App } from './paging-client';
// import { App } from './paging-server';

// -- Sorting
// import { App } from './sorting-server';
// import { App } from './sorting-client';

// -- Templates
// import { App } from './template-dom';
// import { App } from './template-obj';

// -- Selection
// import { App } from './selection-cell';
// import { App } from './selection-multi';

// -- Columns
// import { App } from './column-toggle';
// import { App } from './column-standard';
// import { App } from './column-force';
// import { App } from './column-flex';
// import { App } from './pinning';

@NgModule({
  declarations: [App],
  imports: [BrowserModule, Angular2DataTableModule],
  bootstrap: [App]
})
export class AppModule {

  constructor(private appRef: ApplicationRef) { }

  hmrOnDestroy(store) {
    const cmpLocation = this.appRef.components.map(cmp => cmp.location.nativeElement);
    store.disposeOldHosts = createNewHosts(cmpLocation);
    removeNgStyles();
  }

  hmrAfterDestroy(store) {
    store.disposeOldHosts();
    delete store.disposeOldHosts;
  }
}

// import 'ts-helpers';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  DatatableComponent,
  DataTableColumn,
  DataTableHeader,
  DataTableBody,
  DataTableFooter,
  DataTableHeaderCell,
  DataTablePager,
  DataTableBodyRow,
  DataTableRowWrapper,
  ProgressBar,
  DataTableBodyCell,
  DatatableRowDetailTemplate,
  ScrollerComponent
} from './components';

import {
  Visibility,
  LongPress,
  Resizeable,
  Orderable,
  Draggable
} from './directives';

export * from './types';
export * from './models';
export * from './components';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    Visibility,
    Draggable,
    Resizeable,
    Orderable,
    LongPress,
    ScrollerComponent,
    DatatableComponent,
    DataTableColumn,
    DataTableHeader,
    DataTableHeaderCell,
    DataTableBody,
    DataTableFooter,
    DataTablePager,
    ProgressBar,
    DataTableBodyRow,
    DataTableRowWrapper,
    DatatableRowDetailTemplate,
    DataTableBodyCell
  ],
  exports: [
    DatatableComponent,
    DatatableRowDetailTemplate,
    DataTableColumn
  ]
})
export class Angular2DataTableModule { }

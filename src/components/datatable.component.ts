import {
  Component, Input, Output, ElementRef, EventEmitter,
  HostListener, KeyValueDiffers, ContentChildren, OnInit,
  OnChanges, QueryList, DoCheck, AfterViewInit, IterableDiffer,
  HostBinding, Renderer, ContentChild, TemplateRef, ChangeDetectionStrategy
} from '@angular/core';

import { forceFillColumnWidths, adjustColumnWidths } from '../utils';
import { ColumnMode, SortType, SelectionType } from '../types';
import { TableColumn } from '../models';
import { DataTableColumn } from './datatable-column.directive';
import { DatatableRowDetailTemplate } from './datatable-row-detail-template.directive';
import { scrollbarWidth } from '../utils';

@Component({
  selector: 'datatable',
  template: `
    <div
      visibility-observer
      (onVisibilityChange)="adjustSizes()">
      <datatable-header
        *ngIf="headerHeight"
        [sorts]="sorts"
        [scrollbarH]="scrollbarH"
        [innerWidth]="innerWidth"
        [offsetX]="offsetX"
        [columns]="columns"
        [headerHeight]="headerHeight"
        [sortAscendingIcon]="cssClasses.sortAscending"
        [sortDescendingIcon]="cssClasses.sortDescending"
        (onColumnChange)="onColumnChange.emit($event)">
      </datatable-header>
      <datatable-footer
        *ngIf="footerHeight"
        [rowCount]="rowCount"
        [pageSize]="pageSize"
        [offset]="offset"
        [footerHeight]="footerHeight"
        [pagerLeftArrowIcon]="cssClasses.pagerLeftArrow"
        [pagerRightArrowIcon]="cssClasses.pagerRightArrow"
        [pagerPreviousIcon]="cssClasses.pagerPrevious"
        [pagerNextIcon]="cssClasses.pagerNext"
        (onPageChange)="setPage($event)">
      </datatable-footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTable implements OnInit, AfterViewInit {

  // Rows
  @Input() set rows(val: any[]) {
    this._rows = val;
    this.pageSize = this.calcPageSize(val);
    this.rowCount = this.calcRowCount(val);
  }

  get rows(): any[] {
    return this._rows;
  }

  // Selected rows
  @Input() selected: any[];

  // Columns
  @Input() columns: any[] = [];

  // Enable vertical scrollbars
  @Input() scrollbarV: boolean = false;

  // Enable horz scrollbars
  @Input() scrollbarH: boolean = false;

  // The row height; which is necessary
  // to calculate the height for the lazy rendering.
  @Input() rowHeight: number = 30;

  // The detail row height is required especially when virtual scroll is enabled.
  @Input() detailRowHeight: number = 0;

  // Type of column width distribution.
  // Example: flex, force, standard
  @Input() columnMode: ColumnMode = ColumnMode.standard;

  // Message to show when array is presented
  // but contains no values
  @Input() emptyMessage: string = 'No data to display';

  // The minimum header height in pixels.
  // pass falsey for no header
  // note: number|string does not work right
  @Input() headerHeight: any = 30;

  // The minimum footer height in pixels.
  // pass falsey for no footer
  @Input() footerHeight: number = 0;

  // The minimum table height in pixels.
  @Input() tableHeight: number = 300;

  // if external paging is turned on
  @Input() 
  set externalPaging(val: boolean) {
    this._externalPaging = val; 
    this.rowCount = this.calcRowCount(this.rows);
  }

  get externalPaging(): boolean {
    return this._externalPaging;
  }

  // Page size
  @Input() limit: number = undefined;

  // Total count
  @Input() count: number = 0;

  // Page offset
  @Input() offset: number = 0;

  // Loading indicator
  @Input() loadingIndicator: boolean = false;

  // Selections?
  @Input() selectionType: SelectionType;

  // if you can reorder columns
  @Input() reorderable: boolean = true;

  // type of sorting
  @Input() sortType: SortType = SortType.single;

  // sorts
  @Input() sorts: any[] = [];

  // row detail template
  @Input() rowDetailTemplate: TemplateRef<any>;

  // css class overrides
  @Input() cssClasses: any = {
    sortAscending: 'icon-down',
    sortDescending: 'icon-up',
    pagerLeftArrow: 'icon-left',
    pagerRightArrow: 'icon-right',
    pagerPrevious: 'icon-prev',
    pagerNext: 'icon-skip'
  };

  // This will be used when displaying or selecting rows:
  // when tracking/comparing them, we'll use the value of this fn,
  // (`fn(x) === fn(y)` instead of `x === y`)
  @Input() rowIdentity = ((x) => x);

  @Output() onPageChange: EventEmitter<any> = new EventEmitter();
  @Output() onRowsUpdate: EventEmitter<any> = new EventEmitter();
  @Output() onRowClick: EventEmitter<any> = new EventEmitter();
  @Output() onSelectionChange: EventEmitter<any> = new EventEmitter();
  @Output() onColumnChange: EventEmitter<any> = new EventEmitter();

  @HostBinding('class.fixed-header')
  get isFixedHeader() {
    const headerHeight: number|string = this.headerHeight;

    return (typeof headerHeight === 'string') ?
      (<string>headerHeight) !== 'auto' : true;
  }

  @HostBinding('class.fixed-row')
  get isFixedRow() {
    const rowHeight: number|string = this.rowHeight;

    return (typeof rowHeight === 'string') ?
      (<string>rowHeight) !== 'auto' : true;
  }

  @HostBinding('class.scroll-vertical')
  get isVertScroll() {
    return this.scrollbarV;
  }

  @HostBinding('class.scroll-horz')
  get isHorScroll() {
    return this.scrollbarH;
  }

  @HostBinding('class.selectable')
  get isSelectable() {
    return this.selectionType !== undefined;
  }

  @ContentChildren(DataTableColumn) 
  set columnTemplates(val: QueryList<DataTableColumn>) {
    this._columnTemplates = val;

    if(val) {
      for (let col of val.toArray()) {
        this.columns.push(new TableColumn(col));
      }
    }
  }

  get columnTemplates(): QueryList<DataTableColumn> {
    return this._columnTemplates;
  }

  @ContentChild(DatatableRowDetailTemplate) 
  set rowDetailTemplateChild(val: DatatableRowDetailTemplate) {
    this._rowDetailTemplateChild = val;
    if(val) this.rowDetailTemplate = val.rowDetailTemplate;
  }

  get rowDetailTemplateChild(): DatatableRowDetailTemplate {
    return this._rowDetailTemplateChild;
  }
  
  private offsetX: number = 0;
  private element: HTMLElement;
  private scrollbarWidth: number = scrollbarWidth();
  private innerWidth: number;
  private pageSize: number;
  private bodyHeight: number;
  private rowCount: number;

  private _rows: any[];
  private _columnTemplates: QueryList<DataTableColumn>;
  private _rowDetailTemplateChild: DatatableRowDetailTemplate;
  private _externalPaging: boolean;

  constructor(
    renderer: Renderer,
    element: ElementRef,
    differs: KeyValueDiffers) {

    this.element = element.nativeElement;
    renderer.setElementClass(this.element, 'datatable', true);
  }

  ngOnInit(): void {
    // need to call this immediatly to size
    // if the table is hidden the visibility
    // listener will invoke this itself upon show
    this.adjustSizes();
  }

  ngAfterViewInit() {
    this.adjustColumns();
  }

  adjustSizes() {
    let { height, width } = this.element.getBoundingClientRect();
    this.innerWidth = Math.floor(width);

    if (this.scrollbarV) {
      if (this.headerHeight) height = height - this.headerHeight;
      if (this.footerHeight) height = height - this.footerHeight;
      this.bodyHeight = height;
    }

    this.adjustColumns();
  }

  /**
   * Toggle the expansion of the row
   *
   * @param rowIndex
   */
  toggleExpandRow(row: any) {
    // Should we write a guard here??
    // this.toggleRowExpansion(row);
  }

  /**
   * API method to expand all the rows.
   */
  expandAllRows() {
    // this.toggleAllRows(true);
  }

  /**
   * API method to collapse all the rows.
   */
  collapseAllRows() {
    // this.toggleAllRows(false);
  }

  @HostListener('window:resize')
  adjustColumns(forceIdx?: number): void {
    if (!this.columns) return;

    let width = this.innerWidth;
    if (this.scrollbarV) {
      width = width - this.scrollbarWidth;
    }

    if (this.columnMode === ColumnMode.force) {
      forceFillColumnWidths(this.columns, width, forceIdx);
    } else if (this.columnMode === ColumnMode.flex) {
      adjustColumnWidths(this.columns, width);
    }
  }

  setPage(ev) {

  }

  calcPageSize(val): number {
    // Keep the page size constant even if the row has been expanded.
    // This is because an expanded row is still considered to be a child of
    // the original row.  Hence calculation would use rowHeight only.
    if (this.scrollbarV) return Math.ceil(this.bodyHeight / this.rowHeight);
    
    // if limit is passed, we are paging
    if (this.limit !== undefined) return this.limit;

    // otherwise use row length
    if(val) return val.length;
    
    // other empty :(
    return 0;
  }

  calcRowCount(val): number {
    if(!this.externalPaging) {
      if(val) return val.length;
      return 0;
    }

    return this.count;
  }

}

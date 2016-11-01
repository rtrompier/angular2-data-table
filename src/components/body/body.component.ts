import {
  Component, Output, EventEmitter, Input, HostBinding,
  ViewChild, ElementRef, Renderer, ChangeDetectionStrategy
} from '@angular/core';
import { translateXY, columnsByPin, columnGroupWidths, RowHeightCache } from '../../utils';
import { SelectionType } from '../../types';
import { ScrollerComponent } from './scroller.component';

@Component({
  selector: 'datatable-body',
  template: `
    <datatable-selection 
      #selector
      [selected]="selected"
      [rows]="rows"
      [selectEnabled]="selectEnabled"
      [selectionType]="selectionType"
      [rowIdentity]="rowIdentity"
      (select)="select.emit($event)"
      (activate)="activate.emit($event)">
      <datatable-progress
        *ngIf="loadingIndicator">
      </datatable-progress>
      <datatable-scroller
        *ngIf="rows.length"
        [rowHeight]="rowHeight"
        [scrollbarV]="scrollbarV"
        [scrollbarH]="scrollbarH"
        [count]="rowCount"
        [scrollHeight]="scrollHeight"
        [limit]="limit"
        [scrollWidth]="columnGroupWidths.total"
        (scroll)="onBodyScroll($event)">
        <datatable-row-wrapper 
          *ngFor="let row of temp; let i = index; trackBy: row?.$$index"
          [ngStyle]="getRowsStyles(row)"
          [style.height.px]="getRowHeight(row)"
          [rowDetailTemplate]="rowDetailTemplate"
          [detailRowHeight]="detailRowHeight"
          [row]="row">
          <datatable-body-row
            tabindex="-1"
            [isSelected]="selector.getRowSelected(row)"
            [innerWidth]="innerWidth"
            [offsetX]="offsetX"
            [columns]="columns"
            [rowHeight]="rowHeight"
            [row]="row"
            (activate)="selector.onActivate($event, i)">
          </datatable-body-row>
        </datatable-row-wrapper>
      </datatable-scroller>
      <div
        class="empty-row"
        *ngIf="!rows.length"
        [innerHTML]="emptyMessage">
      </div>
    </datatable-selection>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableBodyComponent {

   @Input() set rows(val: any[]) {
    this._rows = val;
    this.updateIndexes();
    this.updateRows();
  }

  get rows(): any[] {
    return this._rows;
  }

  @Input() set columns(val: any[]) {
    this._columns = val;
    const colsByPin = columnsByPin(val);
    this.columnGroupWidths = columnGroupWidths(colsByPin, val);
  }

  get columns(): any[] { 
    return this._columns; 
  }

  @Input() scrollbarV: boolean;
  @Input() scrollbarH: boolean;
  @Input() loadingIndicator: boolean;
  @Input() rowHeight: number;
  @Input() offsetX: number;
  @Input() offsetY: number;
  @Input() detailRowHeight: any;
  @Input() emptyMessage: string;
  @Input() selectionType: SelectionType;
  @Input() selected: any[];
  @Input() limit: number;
  @Input() pageSize: number;
  @Input() offset: number;
  @Input() rowIdentity: any;
  
  @Input() set rowCount(val: number) {
    this._rowCount = val;
    this.updateIndexes();
    this.updateRows();
  }

  get rowCount(): number {
    return this._rowCount;
  }

  @Input() 
  @HostBinding('style.width')
  set bodyWidth(val) {
    if (this.scrollbarH) {
      this._bodyWidth = val + 'px';
    } else {
      this._bodyWidth = '100%';
    }
  }

  get bodyWidth() {
    return this._bodyWidth;
  }
  
  @Input()
  @HostBinding('style.height')
  set bodyHeight(val) {
    if (this.scrollbarV) {
      this._bodyHeight = val + 'px';
    } else {
      this._bodyHeight = 'auto';
    }
  }

  get bodyHeight() {
    return this._bodyHeight;
  }

  @Output() activate: EventEmitter<any> = new EventEmitter();
  @Output() select: EventEmitter<any> = new EventEmitter();
  @Output() detailToggle: EventEmitter<any> = new EventEmitter();

  @ViewChild(ScrollerComponent) scroller: ScrollerComponent;

  private rowHeightsCache: RowHeightCache = new RowHeightCache();
  private temp: any[] = [];
  private indexes: any;
  private columnGroupWidths: any;

  private _rows: any[];
  private _bodyHeight: any;
  private _bodyWidth: any;
  private _columns: any[];
  private _rowCount: number;

  get selectEnabled() {
    return !!this.selectionType;
  }

  /**
   * Property that would calculate the height of scroll bar
   * based on the row heights cache for virtual scroll. Other scenarios
   * calculate scroll height automatically (as height will be undefined).
   */
  get scrollHeight(): number {
    if(this.scrollbarV) {
      return this.rowHeightsCache.query(this.rowCount - 1);
    }
  }
  
  constructor(element: ElementRef, renderer: Renderer) {
    renderer.setElementClass(element.nativeElement, 'datatable-body', true);
  }

  onBodyScroll(props) {
    this.offsetY = props.scrollYPos;
    this.offsetX = props.scrollXPos;

    this.updatePage(props.direction);
    this.updateRows();
  }

  updatePage(direction) {
    let page = this.indexes.first / this.pageSize;

    if(direction === 'up') {
      page = Math.floor(page);
    } else if(direction === 'down') {
      page = Math.ceil(page);
    }

    if(direction !== undefined && !isNaN(page)) {
      // pages are offset + 1 ;)
      /*
      this.state.setPage({
        type: 'body-event',
        value: page + 1
      });
      */
    }
  }

  updateRows(refresh?: boolean) {
    const { first, last } = this.indexes;
    let rowIndex = first;
    let idx = 0;

    const endSpliceIdx = refresh ? this.rowCount : last - first;
    let temp = this.rows.slice(0, endSpliceIdx);

    while (rowIndex < last && rowIndex < this.rowCount) {
      let row = temp[rowIndex];

      if(row) {
        row.$$index = rowIndex;
        temp[idx] = row;
      }

      idx++;
      rowIndex++;
    }

    console.log('temps', temp, first, last)

    this.temp = temp;
    this.refreshRowHeightCache();
  }

  /**
   * Calculate row height based on the expanded state of the row.
   *
   * @param row  the row for which the height need to be calculated.
   * @returns {number}  height of the row.
   */
  getRowHeight(row: any): number {
    // Adding detail row height if its expanded.
    return this.rowHeight +
      (row.$$expanded === 1 ? this.detailRowHeight : 0 );
  }

  /**
   * Calculates the styles for the row so that the rows can be moved in 2D space
   * during virtual scroll inside the DOM.   In the below case the Y position is
   * manipulated.   As an example, if the height of row 0 is 30 px and row 1 is
   * 100 px then following styles are generated:
   *
   * transform: translate3d(0px, 0px, 0px);    ->  row0
   * transform: translate3d(0px, 30px, 0px);   ->  row1
   * transform: translate3d(0px, 130px, 0px);  ->  row2
   *
   * Row heights have to be calculated based on the row heights cache as we wont
   * be able to determine which row is of what height before hand.  In the above
   * case the positionY of the translate3d for row2 would be the sum of all the
   * heights of the rows before it (i.e. row0 and row1).
   *
   * @param row The row that needs to be placed in the 2D space.
   * @returns {{styles: string}}  Returns the CSS3 style to be applied
   */
  getRowsStyles(row) {
    const rowHeight = this.getRowHeight(row);

    let styles = {
      height: rowHeight + 'px'
    };

    if(this.scrollbarV) {
      const idx = row ? row.$$index : 0;
      
      // const pos = idx * rowHeight;
      // The position of this row would be the sum of all row heights
      // until the previous row position.
      const pos = this.rowHeightsCache.query(idx - 1);

      translateXY(styles, 0, pos);
    }

    return styles;
  }

  hideIndicator(): void {
    setTimeout(() => this.loadingIndicator = false, 500);
  }

  updateIndexes(): void {
    let first = 0;
    let last = 0;

    if (this.scrollbarV) {
      // Calculation of the first and last indexes will be based on where the
      // scrollY position would be at.  The last index would be the one
      // that shows up inside the view port the last.
      first = this.rowHeightsCache.getRowIndex(this.offsetY);
      last = this.rowHeightsCache.getRowIndex(this.bodyHeight + this.offsetY) + 1;
    } else {
      first = Math.max(this.offset * this.pageSize, 0);
      last = Math.min((first + this.pageSize), this.rowCount);
    }

    this.indexes = { first, last };
  }

  /**
   *  Refreshes the full Row Height cache.  Should be used
   *  when the entire row array state has changed.
   */
  refreshRowHeightCache(): void {
    if(!this.scrollbarV) return;

    // clear the previous row height cache if already present.
    // this is useful during sorts, filters where the state of the
    // rows array is changed.
    this.rowHeightsCache.clearCache();

    // Initialize the tree only if there are rows inside the tree.
    if (this.rows.length) {
      this.rowHeightsCache.initCache(
        this.rows, this.rowHeight, this.detailRowHeight);
    }
  }

  getAdjustedViewPortIndex(): number {
    // Capture the row index of the first row that is visible on the viewport.
    // If the scroll bar is just below the row which is highlighted then make that as the
    // first index.
    let viewPortFirstRowIndex =  this.indexes.first;

    if (this.scrollbarV) {
      let offsetScroll = this.rowHeightsCache.query(viewPortFirstRowIndex - 1);
      return offsetScroll <= this.offsetY ? viewPortFirstRowIndex - 1 : viewPortFirstRowIndex;
    }

    return viewPortFirstRowIndex;
  }

  /**
   * Toggle the Expansion of the row i.e. if the row is expanded then it will
   * collapse and vice versa.   Note that the expanded status is stored as
   * a part of the row object itself as we have to preserve the expanded row
   * status in case of sorting and filtering of the row set.
   *
   * @param row The row for which the expansion needs to be toggled.
   */
  toggleRowExpansion(row: any) {
    // Capture the row index of the first row that is visible on the viewport.
    let viewPortFirstRowIndex =  this.getAdjustedViewPortIndex();

    // If the detailRowHeight is auto --> only in case of non-virtualized scroll
    if(this.scrollbarV) {
      const detailRowHeight = this.detailRowHeight * (row.$$expanded ? -1 : 1);
      this.rowHeightsCache.update(row.$$index, detailRowHeight);
    }
    
    // Update the toggled row and update the heights in the cache.
    row.$$expanded ^= 1;

    this.detailToggle.emit({
      rows: [row], 
      currentIndex: viewPortFirstRowIndex 
    });

    // Broadcast the event to let know that the rows array has been updated.
    // this.onRowsUpdate.emit(this.rows);
  }

  /**
   * Expand/Collapse all the rows no matter what their state is.
   *
   * @param expanded When true, all rows are expanded and when false, all rows will be collapsed.
   */
  toggleAllRows(expanded: boolean) {
    let rowExpanded = expanded ? 1 : 0;
    // Capture the row index of the first row that is visible on the viewport.
    let viewPortFirstRowIndex =  this.getAdjustedViewPortIndex();

    this.rows.forEach((row: any) => {
      row.$$expanded = rowExpanded;
    });

    if(this.scrollbarV) {
      // Refresh the full row heights cache since every row was affected.
      this.refreshRowHeightCache();
    }

    // Emit all rows that have been expanded.
    this.detailToggle.emit({
      rows: this.rows, 
      currentIndex: viewPortFirstRowIndex 
    });

    // Broadcast the event to let know that the rows array has been updated.
    // this.onRowsUpdate.emit(this.rows);
  }

}

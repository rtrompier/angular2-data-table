import {
  Component,
  Output,
  EventEmitter,
  Input,
  OnInit,
  HostBinding,
  OnDestroy,
  ViewChild,
  ElementRef,
  Renderer,
  ChangeDetectionStrategy
} from '@angular/core';

import { Subscription } from 'rxjs/Subscription';
import { Keys, selectRows, selectRowsBetween, translateXY, columnsByPin, columnGroupWidths } from '../../utils';
import { SelectionType, ClickType } from '../../types';
import { ScrollerComponent } from './scroller.component';

@Component({
  selector: 'datatable-body',
  template: `
    <div>
      <datatable-progress
        *ngIf="loadingIndicator">
      </datatable-progress>
      <datatable-scroller
        *ngIf="rows.length"
        (onScroll)="onBodyScroll($event)"
        [rowHeight]="rowHeight"
        [scrollbarV]="scrollbarV"
        [scrollbarH]="scrollbarH"
        [count]="rowCount"
        [scrollHeight]="scrollHeight"
        [limit]="limit"
        [scrollWidth]="columnGroupWidths.total">
        <datatable-row-wrapper 
          *ngFor="let row of temp; let i = index; trackBy: row?.$$index"
          [ngStyle]="getRowsStyles(row)"
          [style.height]="getRowHeight(row) + 'px'"
          [rowDetailTemplate]="rowDetailTemplate"
          [detailRowHeight]="detailRowHeight"
          [row]="row">
          <datatable-body-row
            [attr.tabindex]="i"
            [style.height]="rowHeight +  'px'"
            [isSelected]="getRowSelected(row)"
            [innerWidth]="innerWidth"
            [scrollbarWidth]="scrollbarWidth"
            [offsetX]="offsetX"
            [columns]="columns"
            [rowHeight]="rowHeight"
            [row]="row"
            [class.datatable-row-even]="row.$$index % 2 === 0"
            [class.datatable-row-odd]="row.$$index % 2 !== 0"
            (click)="rowClicked($event, i, row)"
            (dblclick)="rowClicked($event, i, row)"
            (keydown)="rowKeydown($event, i, row)">
          </datatable-body-row>
        </datatable-row-wrapper>
      </datatable-scroller>
      <div
        class="empty-row"
        *ngIf="!rows.length"
        [innerHTML]="emptyMessage">
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableBodyComponent {

   @Input() set rows(val: any[]) {
    this._rows = val;
    this.indexes = this.calcIndexes();
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
  
  //@Input() rowCount: number;

  @Input() set rowCount(val: number) {
    this._rowCount = val;

    // THIS IS REALLY ODD I HAVE TO DO THIS!
    this.indexes = this.calcIndexes();
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

  @Output() onRowClick: EventEmitter<any> = new EventEmitter();
  @Output() onRowSelect: EventEmitter<any> = new EventEmitter();

  @ViewChild(ScrollerComponent) scroller: ScrollerComponent;

  private temp: any[] = [];
  private rowHeightsCache: any;
  private scrollHeight: any;
  private prevIndex: number;
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

  constructor(element: ElementRef, renderer: Renderer) {
    renderer.setElementClass(element.nativeElement, 'datatable-body', true);
  }

  /*
  ngOnInit(): void {
    this.rows = [...this.state.rows];
    this.updateRows();

    this.sub = this.state.onPageChange.subscribe((action) => {
      this.updateRows();
      this.hideIndicator();

      if(this.state.options.scrollbarV && action.type === 'pager-event') {
        // First get the row Index that we need to move to.
        const rowIndex = action.limit * action.offset;
        // const offset = (this.state.options.rowHeight * action.limit) * action.offset;
        this.scroller.setOffset(this.state.rowHeightsCache.query(rowIndex - 1));
      }
    });

    this.sub.add(this.state.onExpandChange.subscribe( (expandedState) => {
      if(this.state.options.scrollbarV) {
        // If there was more than one row expanded then there was a mass change
        // in the data set hence adjust the scroll position.
        if (expandedState.rows.length > 1) {
          // -1 is added to the scrollOffset as we want to move the scroller to the offset position
          // where the entire row is visible. What about the small offset e.g. if the scroll
          // position is between rows?  Do we need to take care of it?
          let scrollOffset = this.state.rowHeightsCache.query(expandedState.currentIndex);
          // Set the offset only after the scroll bar has been updated on the screen.
          setTimeout(() => this.scroller.setOffset(scrollOffset));
        }
      }
    }));

    this.sub.add(this.state.onRowsUpdate.subscribe(rows => {
      this.updateRows();
      this.hideIndicator();
    }));

    this.sub.add(this.state.onSortChange.subscribe(() => {
      this.scroller.setOffset(0);
    }));
  }
  */

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
    let idx = 0;
    const { first, last } = this.indexes;
    let rowIndex = first;

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

    this.temp = temp;
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

  rowClicked(event, index, row): void {
    let clickType = event.type === 'dblclick' ? 
      ClickType.double : 
      ClickType.single;

    this.onRowClick.emit({ type: clickType, event, row });
    this.selectRow(event, index, row);
  }

  rowKeydown(event, index, row) {
    if (event.keyCode === Keys.return && this.selectEnabled) {
      this.selectRow(event, index, row);
    } else if (event.keyCode === Keys.up || event.keyCode === Keys.down) {
      const dom = event.keyCode === Keys.up ?
        event.target.previousElementSibling :
        event.target.nextElementSibling;

      if (dom) dom.focus();
    }
  }

  selectRow(event, index, row) {
    /*
    if (!this.selectEnabled) return;

    const multiShift = this.state.options.selectionType === SelectionType.multiShift;
    const multiClick = this.state.options.selectionType === SelectionType.multi;
    let selections = [];

    if (multiShift || multiClick) {
      if (multiShift && event.shiftKey) {
        const selected = [...this.state.selected];
        selections = selectRowsBetween(
          selected, this.rows, index, this.prevIndex,
          (r, s) => { return this.state.getRowSelectedIdx(r, s); });
      } else if (multiShift && !event.shiftKey) {
        selections.push(row);
      } else {
        const selected = [...this.state.selected];
        selections = selectRows(selected, row,
          (r, s) => { return this.getRowSelectedIdx(r, s); });
      }
    } else {
      selections.push(row);
    }

    this.prevIndex = index;
    this.onRowSelect.emit(selections);
    */
  }

  ngOnDestroy(): void {
    // if (this.sub) this.sub.unsubscribe();
  }

  calcIndexes() {
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

    return { first, last };
  }

  getRowSelected(row) {
    // return this.getRowSelectedIdx(this.row, this.selected) > -1;
  }

}

import {
  Component, Output, ElementRef, Renderer,
  EventEmitter, Input, HostBinding, ChangeDetectionStrategy
} from '@angular/core';

import { translateXY } from '../../utils';
import { columnsByPin, columnGroupWidths } from '../../utils';

@Component({
  selector: 'datatable-header',
  template: `
    <div
      [style.width]="columnGroupWidths.total + 'px'"
      class="datatable-header-inner"
      orderable
      (onReorder)="columnReordered($event)">
      <div
        *ngFor="let colGroup of columnsByPin"
        [class]="'datatable-row-' + colGroup.type"
        [ngStyle]="stylesByGroup(colGroup.type)">
        <datatable-header-cell
          *ngFor="let column of colGroup.columns; trackBy: column?.$$id"
          resizeable
          [resizeEnabled]="column.resizeable"
          (onResize)="columnResized($event, column)"
          long-press
          (onLongPress)="drag = true"
          (onLongPressEnd)="drag = false"
          draggable
          [dragX]="column.draggable && drag"
          [dragY]="false"
          [headerHeight]="headerHeight"
          [columnName]="column.name"
          [columnProp]="column.prop"
          [sortAscendingIcon]="sortAscendingIcon"
          [sortDescendingIcon]="sortDescendingIcon"
          [sortDir]="getSortDirection(column)"
          [cellMinWidth]="column.minWidth"
          [cellMaxWidth]="column.maxWidth"
          [cellWidth]="column.width"
          [headerTemplate]="column.headerTemplate"
          [isSortable]="column.sortable"
          [isResizeable]="column.resizeable"
          (onColumnChange)="onColumnChange.emit($event)">
        </datatable-header-cell>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableHeader {

  @Input() sortAscendingIcon: any;
  @Input() sortDescendingIcon: any;
  @Input() scrollbarH: boolean;
  @Input() innerWidth: number;
  @Input() offsetX: number;
  @Input() sorts: any;

  @HostBinding('style.height')
  @Input() set headerHeight(val: any) {
    if(val !== 'auto') { 
      this._headerHeight = `${val}px`;
    } else {
      this._headerHeight = val;
    }
  }

  get headerHeight() {
    return this._headerHeight;
  }

  @Input() set columns(val: any[]) {
    this._columns = val;

    // lets convert this to a array so we can handle
    // this better in the template
    let colsByPinArr = [];
    const colsByPin = columnsByPin(val);
    colsByPinArr.push({ type: 'left', columns: colsByPin['left'] });
    colsByPinArr.push({ type: 'center', columns: colsByPin['center'] });
    colsByPinArr.push({ type: 'right', columns: colsByPin['right'] });
    this.columnsByPin = colsByPinArr;

    this.columnGroupWidths = columnGroupWidths(colsByPin, val);
  }

  get columns(): any[] { 
    return this._columns; 
  }

  @Output() onColumnChange: EventEmitter<any> = new EventEmitter();

  private columnsByPin: any;
  private columnGroupWidths: any;
  private _columns: any[];
  private _headerHeight: string;

  @HostBinding('style.width')
  private get headerWidth(): string {
    if(this.scrollbarH) {
      return this.innerWidth + 'px';
    }

    return '100%';
  }

  constructor(element: ElementRef, renderer: Renderer) {
    renderer.setElementClass(element.nativeElement, 'datatable-header', true);
  }

  getSortDirection(column) {
    if(this.sorts) {
      const sort = this.sorts.find(s => {
        return s.prop === column.prop;
      });

      if(sort) return sort.dir;
    }
  }

  columnResized(width, column) {
    if (width <= column.minWidth) {
      width = column.minWidth;
    } else if(width >= column.maxWidth) {
      width = column.maxWidth;
    }

    column.width = width;

    this.onColumnChange.emit({
      type: 'resize',
      value: column
    });
  }

  columnReordered({ prevIndex, newIndex, model }) {
    // this.columns.splice(prevIndex, 1);
    // this.columns.splice(newIndex, 0, model);

    this.onColumnChange.emit({
      type: 'reorder',
      value: model,
      prevIndex,
      newIndex
    });
  }

  stylesByGroup(group) {
    const widths = this.columnGroupWidths;
    const offsetX = this.offsetX;

    let styles = {
      width: `${widths[group]}px`
    };

    if(group === 'center') {
      translateXY(styles, offsetX * -1, 0);
    } else if(group === 'right') {
      const totalDiff = widths.total - this.innerWidth;
      const offset = totalDiff * -1;
      translateXY(styles, offset, 0);
    }

    return styles;
  }

}

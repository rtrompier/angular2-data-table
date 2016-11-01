import { Component, Input, HostBinding, ElementRef, Renderer, Output, EventEmitter } from '@angular/core';
import { columnsByPin, columnGroupWidths, columnsByPinArr, translateXY } from '../../utils';

@Component({
  selector: 'datatable-body-row',
  template: `
    <div
      *ngFor="let colGroup of columnsByPin; let i = index; trackBy: $colGroup?.type"
      class="datatable-row-{{colGroup.type}} datatable-row-group"
      [ngStyle]="stylesByGroup(colGroup.type)"
      [style.width]="columnGroupWidths[colGroup.type] + 'px'">
      <datatable-body-cell
        *ngFor="let column of colGroup.columns; let ii = index; trackBy: column?.$$id"
        [attr.tabindex]="getCellTabIdx(rowIndex, i, ii)"
        [row]="row"
        [column]="column"
        [rowHeight]="rowHeight"
        (activate)="activate.emit($event)">
      </datatable-body-cell>
    </div>
  `
})
export class DataTableBodyRowComponent {

  @Input() set columns(val: any[]) {
    this._columns = val;
    
    const colsByPin = columnsByPin(val);
    this.columnsByPin = columnsByPinArr(val);
    this.columnGroupWidths = columnGroupWidths(colsByPin, val);
  }

  get columns(): any[] { 
    return this._columns; 
  }

  @Input() rowIndex: number;
  @Input() row: any;
  @Input() innerWidth: number;
  @Input() scrollbarWidth: number;
  @Input() offsetX: number;
  @Input() rowHeight: number;

  @HostBinding('class.active')
  @Input() isSelected: boolean;

  @Output() activate: EventEmitter<any> = new EventEmitter();

  @HostBinding('attr.tabindex')
  private get rowTabIndex(): number {
    const idx = this.rowIndex + 1;
    if(idx === 1) return idx;
    if(this.columns) return idx + this.columns.length;
  }

  private columnGroupWidths: any;
  private columnsByPin: any;
  private _columns: any[];

  constructor(element: ElementRef, renderer: Renderer) {
    renderer.setElementClass(element.nativeElement, 'datatable-body-row', true);
  }

  stylesByGroup(group) {
    const widths = this.columnGroupWidths;
    const offsetX = this.offsetX;

    let styles = {
      width: `${widths[group]}px`
    };

    if(group === 'left') {
      translateXY(styles, offsetX, 0);
    } else if(group === 'right') {
      const totalDiff = widths.total - this.innerWidth;
      const offsetDiff = totalDiff - offsetX;
      const offset = (offsetDiff + this.scrollbarWidth) * -1;
      translateXY(styles, offset, 0);
    }

    return styles;
  }

  getCellTabIdx(rowIndex: number, groupIndex: number, cellIndex: number): number {
    if(!this.columns) return 0;

    rowIndex = rowIndex + 1;
    cellIndex = cellIndex + 1; 

    if(rowIndex === 1) return rowIndex + cellIndex;
    return (rowIndex * this.columns.length) + cellIndex;
  }

}

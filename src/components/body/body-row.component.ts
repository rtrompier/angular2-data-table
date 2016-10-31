import { Component, Input, HostBinding, ElementRef, Renderer } from '@angular/core';
import { columnsByPin, columnGroupWidths, columnsByPinArr, translateXY } from '../../utils';

@Component({
  selector: 'datatable-body-row',
  template: `
    <div
      *ngFor="let colGroup of columnsByPin; trackBy: $colGroup?.type"
      class="datatable-row-{{colGroup.type}} datatable-row-group"
      [ngStyle]="stylesByGroup(colGroup.type)"
      [style.width]="columnGroupWidths[colGroup.type] + 'px'">
      <datatable-body-cell
        *ngFor="let column of colGroup.columns; trackBy: column?.$$id"
        [row]="row"
        [column]="column"
        [rowHeight]="rowHeight">
      </datatable-body-cell>
    </div>
  `
})
export class DataTableBodyRow {

  @Input() set columns(val: any[]) {
    this._columns = val;
    
    const colsByPin = columnsByPin(val);
    this.columnsByPin = columnsByPinArr(val);
    this.columnGroupWidths = columnGroupWidths(colsByPin, val);
  }

  get columns(): any[] { 
    return this._columns; 
  }

  @Input() row: any;
  @Input() innerWidth: number;
  @Input() scrollbarWidth: number;
  @Input() offsetX: number;
  @Input() rowHeight: number;

  @HostBinding('class.active')
  @Input() isSelected: boolean;

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

}

import {
  Component, Input, PipeTransform, HostBinding, Output, EventEmitter, HostListener
} from '@angular/core';

import { deepValueGetter, Keys } from '../../utils';
import { SortDirection } from '../../types';

@Component({
  selector: 'datatable-body-cell',
  template: `
    <div class="datatable-body-cell-label">
      <span
        *ngIf="!column.cellTemplate"
        [innerHTML]="value">
      </span>
      <template
        *ngIf="column.cellTemplate"
        [ngTemplateOutlet]="column.cellTemplate"
        [ngOutletContext]="{ value: value, row: row, column: column }">
      </template>
    </div>
  `
})
export class DataTableBodyCellComponent {

  @Input() column: any;
  @Input() row: any;
  @Input() rowHeight: number;
  @Input() sorts: any;

  @Output() activate: EventEmitter<any> = new EventEmitter();

  @HostListener('click', ['$event'])
  onClick(event) {
    this.activate.emit({
      type: 'click',
      event,
      column: this.column,
      value: this.value
    });
  }

  @HostListener('dblclick', ['$event'])
  onDblClick(event) {
    this.activate.emit({
      type: 'dblclick',
      event,
      column: this.column,
      value: this.value
    });
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event) {
    const keyCode = event.keyCode;
    const isAction = 
      keyCode === Keys.return ||
      keyCode === Keys.down ||
      keyCode === Keys.up ||
      keyCode === Keys.left ||
      keyCode === Keys.right;

    if(isAction) {
      this.activate.emit({
        type: 'keydown',
        event,
        row: this.row,
        column: this.column,
        value: this.value
      });
    }
  }

  @HostBinding('class')
  get cssClasses(): string {
    let cls = 'datatable-body-cell';
    const sortDir: SortDirection = this.sortDir;

    if(sortDir) {
      cls += ` sort-active sort-${sortDir}`;
    }

    return cls;
  }

  @HostBinding('style.width.px')
  get width(): number {
    return this.column.width;
  }

  @HostBinding('style.height')
  get height(): string|number {
    const height = this.rowHeight;
    if(isNaN(height)) return height;
    return height + 'px';
  }

  get sortDir() {
    if(this.sorts) {
      let sort = this.sorts.find(s => {
        return s.prop === this.column.prop;
      });

      if(sort) return sort.dir;
    }
  }

  get value(): any {
    if (!this.row) return '';
    const prop = deepValueGetter(this.row, this.column.prop);
    const userPipe: PipeTransform = this.column.pipe;
    return userPipe ? userPipe.transform(prop) : prop;
  }
}

import {
  Component, Input, EventEmitter,
  Output, HostBinding, ChangeDetectionStrategy
} from '@angular/core';

import { SortDirection } from '../../types';

@Component({
  selector: 'datatable-header-cell',
  template: `
    <div>
      <span
        class="datatable-header-cell-label draggable"
        *ngIf="!headerTemplate"
        (click)="onSort()"
        [innerHTML]="name">
      </span>
      <template
        *ngIf="headerTemplate"
        [ngTemplateOutlet]="headerTemplate"
        [ngOutletContext]="{ 
          columnName: columnName, 
          sortDir: sortDir, 
          columnProp: columnProp 
        }">
      </template>
      <span
        class="sort-btn"
        [ngClass]="sortClasses()">
      </span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableHeaderCell {

  @Input() columnName: any;
  @Input() columnProp: any;
  @Input() sortAscendingIcon: any;
  @Input() sortDescendingIcon: any;
  @Input() sortDir: any;
  @Input() headerTemplate: any;

  @HostBinding('style.height')
  @Input() headerHeight: any;

  @HostBinding('style.minWidth.px')
  @Input() cellMinWidth: any;

  @HostBinding('style.maxWidth.px')
  @Input() cellMaxWidth: any;

  @HostBinding('style.width.px')
  @Input() cellWidth: any;

  @Input() isSortable: boolean;
  @Input() isResizeable: boolean;

  @Output() onColumnChange: EventEmitter<any> = new EventEmitter();

  @HostBinding('attr.title')
  private get colTitle() { return this.name; }

  @HostBinding('class')
  get columnCssClasses() {
    let cls = 'datatable-header-cell';

    if(this.isSortable) cls += ' sortable';
    if(this.isResizeable) cls += ' resizeable';

    const sortDir = this.sortDir;
    if(sortDir) {
      cls += ` sort-active sort-${sortDir}`;
    }

    return cls;
  }

  get name() {
    return this.columnName || this.columnProp;
  }

  sortClasses(sort) {
    let result = {};
    const dir = this.sortDir;

    if(dir === SortDirection.asc) {
      result[`sort-asc ${this.sortAscendingIcon}`] = true;
    } else if(dir === SortDirection.desc) {
      result[`sort-desc ${this.sortDescendingIcon}`] = true;
    }

    return result;
  }

  onSort() {
    if(this.isSortable) {
      // this.nextSort(this.column);

      this.onColumnChange.emit({
        type: 'sort'
        // value: this.column
      });
    }
  }

}

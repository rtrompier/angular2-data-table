import {
  Component, Input, PipeTransform, HostBinding
} from '@angular/core';

import { deepValueGetter } from '../../utils';
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
  get width(): any {
    return this.column.width;
  }

  @HostBinding('style.height')
  get height(): any {
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

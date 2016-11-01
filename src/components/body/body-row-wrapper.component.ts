import { Component, Input, Renderer, ElementRef, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'datatable-row-wrapper',
  template: `
    <ng-content></ng-content>
    <div 
      *ngIf="row.$$expanded === 1 && rowDetailTemplate"
      [style.height]="detailRowHeight +  'px'" 
      class="datatable-row-detail">
      <template
        [ngTemplateOutlet]="rowDetailTemplate"
        [ngOutletContext]="{ row: row }">
      </template>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableRowWrapperComponent {

  @Input() rowDetailTemplate: any;
  @Input() detailRowHeight: any;
  @Input() row: any;

  constructor(public element: ElementRef, renderer: Renderer) {
    renderer.setElementClass(this.element.nativeElement, 'datatable-row-wrapper', true);
  }
}

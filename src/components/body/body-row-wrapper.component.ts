import { Component, Input, Renderer, ElementRef, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'datatable-row-wrapper',
  template: `
    <ng-content></ng-content>
    <div 
      *ngIf="isActive"
      [style.height.px]="detailRowHeight" 
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

  get isActive(): boolean {
    return this.row.$$expanded === 1 && this.rowDetailTemplate;
  }

  constructor(public element: ElementRef, renderer: Renderer) {
    renderer.setElementClass(this.element.nativeElement, 'datatable-row-wrapper', true);
  }

}

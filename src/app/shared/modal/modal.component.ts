import { Component } from '@angular/core';
import { ModalService } from './modal.service';

@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.css']
})
export class ModalComponent {
    constructor(public modalService: ModalService) {}

    closeModal(): void {
        this.modalService.close();
    }

    onConfirm(): void {
        this.modalService.respond(true);
    }

    onCancel(): void {
        this.modalService.respond(false);
    }
}

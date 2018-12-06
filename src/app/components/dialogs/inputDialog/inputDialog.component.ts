import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
    selector: 'input-dialog',
    templateUrl: './inputDialog.component.html',
    styleUrls: ['./inputDialog.component.scss']
})
export class InputDialogComponent implements OnInit {
    constructor(@Inject(MAT_DIALOG_DATA) public data: any,
        private dialogRef: MatDialogRef<InputDialogComponent>) {
    }

    public inputText: string;

    public closeDialog(): void {
        if (this.inputText) {
            this.dialogRef.close(true); // Force return "true"
        }
    }

    ngOnInit() {
    }
}

import { Component, OnInit, ViewEncapsulation, OnDestroy, HostListener, NgZone } from '@angular/core';
import { remote } from 'electron';
import { ActivatedRoute } from '@angular/router';
import { NoteDetailsResult } from '../../services/results/noteDetailsResult';
import log from 'electron-log';
import { MatDialog, MatDialogRef } from '@angular/material';
import { ChangeNotebookDialogComponent } from '../dialogs/changeNotebookDialog/changeNotebookDialog.component';
import { Constants } from '../../core/constants';
import { Subject } from 'rxjs';
import { debounceTime } from "rxjs/internal/operators";

@Component({
    selector: 'note-content',
    templateUrl: './note.component.html',
    styleUrls: ['./note.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class NoteComponent implements OnInit, OnDestroy {
    constructor(private activatedRoute: ActivatedRoute, private zone: NgZone,
        private dialog: MatDialog) {
    }

    private saveTimeoutMilliseconds: number = 5000;

    private globalEmitter = remote.getGlobal('globalEmitter');
    private noteId: string;
    public noteTitle: string;
    public notebookName: string;
    public isMarked: boolean;

    public noteTitleChanged: Subject<string> = new Subject<string>();

    private setNoteMarkListener: any = this.setNoteMark.bind(this);
    private setNotebookListener: any = this.setNotebook.bind(this);

    // ngOndestroy doesn't tell us when a note window is closed, so we use this event instead.
    @HostListener('window:beforeunload', ['$event'])
    beforeunloadHandler(event) {
        this.globalEmitter.emit(Constants.setNoteOpenEvent, this.noteId, false);

        this.globalEmitter.removeListener(`${Constants.sendNoteMarkEvent}-${this.noteId}`, this.setNoteMarkListener);
        this.globalEmitter.removeListener(`${Constants.sendNotebookNameEvent}-${this.noteId}`, this.setNotebookListener);
        
    }

    ngOnDestroy() {
    }

    ngOnInit() {
        this.activatedRoute.queryParams.subscribe(async (params) => {
            this.noteId = params['id'];
            this.globalEmitter.on(`${Constants.sendNoteMarkEvent}-${this.noteId}`, this.setNoteMarkListener);
            this.globalEmitter.on(`${Constants.sendNotebookNameEvent}-${this.noteId}`, this.setNotebookListener);
            this.globalEmitter.emit(Constants.setNoteOpenEvent, this.noteId, true);
            this.globalEmitter.emit(Constants.getNoteDetailsEvent, this.noteId, this.getNoteDetailsCallback.bind(this));
        });

        this.noteTitleChanged
            .pipe(debounceTime(this.saveTimeoutMilliseconds))
            .subscribe(async (newNoteTitle) => {
                await this.saveNoteTitleAsync(newNoteTitle);
            });
    }

    private getNoteDetailsCallback(result: NoteDetailsResult) {
        this.zone.run(() => {
            this.noteTitle = result.noteTitle;
            this.notebookName = result.notebookName;
            this.isMarked = result.isMarked;
        });
    }

    private setNoteMark(isMarked: boolean) {
        this.zone.run(() => {
            this.isMarked = isMarked;
        });
    }

    private setNotebook(notebookName: string) {
        this.zone.run(() => {
            this.notebookName = notebookName;
        });
    }

    private handleNoteMarkToggled(isNoteMarked: boolean) {
        this.zone.run(() => this.isMarked = isNoteMarked);
    }

    public changeNotebook(): void {
        let dialogRef: MatDialogRef<ChangeNotebookDialogComponent> = this.dialog.open(ChangeNotebookDialogComponent, {
            width: '450px', data: { noteId: this.noteId }
        });
    }

    public toggleNoteMark(): void {
        this.globalEmitter.emit(Constants.toggleNoteMarkEvent, this.noteId);
    }

    public onNotetitleChange(newNoteTitle: string) {
        this.noteTitleChanged.next(newNoteTitle);
    }

    private async saveNoteTitleAsync(newNoteTitle: string): Promise<void> {
        // let result: OperationResult = this.Service.renameNote(this.noteId, this.originalNoteTitle, newNoteTitle);

        // if (result.operation === Operation.Blank) {
        //     this.noteTitle = this.originalNoteTitle;
        //     this.snackBarService.noteTitleCannotBeEmptyAsync();
        // } else if (result.operation === Operation.Error) {
        //     this.noteTitle = this.originalNoteTitle;
        //     let generatedErrorText: string = (await this.translateService.get('ErrorTexts.RenameNoteError', { noteTitle: this.originalNoteTitle }).toPromise());

        //     this.dialog.open(ErrorDialogComponent, {
        //         width: '450px', data: { errorText: generatedErrorText }
        //     });
        // } else if (result.operation === Operation.Success) {
        //     this.originalNoteTitle = result.noteTitle;
        //     this.noteTitle = result.noteTitle;
        // } else {
        //     // Do nothing
        // }

        // TODO: global event
        log.info("SAVING NOTE TITLE");
    }
}

import { LightningElement } from 'lwc';
import { deepClone } from 'c/utilCommon';
import fetchDataHelper from './fetchDataHelper';

const ACTIONS = [
    { label: 'Activate', name: 'activate' }
];

const COLUMNS = [
    { label: 'Display Format', fieldName: 'name' },
    { label: 'Active', fieldName: 'isActive', type: 'boolean' },
    { label: 'Desciption', fieldName: 'description', type: 'text' },
    { label: 'Last Used Number', fieldName: 'lastUsedNumber', type: 'text' },
    {
        type: 'action',
        typeAttributes: { rowActions: ACTIONS },
    },
];

export default class geBatchNumberSettings extends LightningElement {
    _autonumberRecords = [];
    columns = COLUMNS;

    connectedCallback() {
        this.retrieveAutonumberRecords();
    }

    async retrieveAutonumberRecords() {
        // Placeholder retrieve call
        this._autonumberRecords = await fetchDataHelper({ amountOfRecords: 5 });
        this._autonumberRecords = this._autonumberRecords.map((record, index) => {
            record.isActive = false;
            if (index === 0) { record.isActive = true }
            record.description = 'lorem ipsum';

            return record;
        });
        console.log(deepClone(this._autonumberRecords));
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'activate':
                this.activeAutonumberRecord(row);
                break;
            default:
        }
    }

    activeAutonumberRecord(row) {
        // do something
        console.log('activating autonumber record...', deepClone(row));
    }

    handleCreateBatchNumberClick() {
        // do something
        console.log('creating batch number record...');
    }
}
import {LightningElement, wire} from 'lwc';
import {getObjectInfo} from 'lightning/uiObjectInfoApi';
import isSysAdmin from '@salesforce/apex/GE_AutoNumberController.isSysAdmin';
import save from '@salesforce/apex/GE_AutoNumberController.save';
import activate from '@salesforce/apex/GE_AutoNumberController.activate';
import deactivate from '@salesforce/apex/GE_AutoNumberController.deactivate';
import getAutoNumbers from '@salesforce/apex/GE_AutoNumberController.getAutoNumbers';

import DataImportBatch from '@salesforce/schema/DataImportBatch__c';
import Batch_Number from '@salesforce/schema/DataImportBatch__c.Batch_Number__c';

import AutoNumber from '@salesforce/schema/AutoNumber__c';
import Description from '@salesforce/schema/AutoNumber__c.Description__c';
import Display_Format from '@salesforce/schema/AutoNumber__c.Display_Format__c';
import Field_API_Name from '@salesforce/schema/AutoNumber__c.Field_API_Name__c';
import IsActive from '@salesforce/schema/AutoNumber__c.IsActive__c';
import Max_Used_Number from '@salesforce/schema/AutoNumber__c.Max_Used_Number__c';
import Object_API_Name from '@salesforce/schema/AutoNumber__c.Object_API_Name__c';
import Starting_Number from '@salesforce/schema/AutoNumber__c.Starting_Number__c';

import commonActivate from '@salesforce/label/c.commonActivate';
import commonDeactivate from '@salesforce/label/c.commonDeactivate';
import batchNumberSettingsConfigureHeader
    from '@salesforce/label/c.batchNumberSettingsConfigureHeader';
import batchNumberSettingsDescActivation
    from '@salesforce/label/c.batchNumberSettingsDescActivation';
import batchNumberSettingsDescDisplayFormat
    from '@salesforce/label/c.batchNumberSettingsDescDisplayFormat';
import batchNumberSettingsDescription
    from '@salesforce/label/c.batchNumberSettingsDescription';
import batchNumberSettingsHeaderFormats
    from '@salesforce/label/c.batchNumberSettingsHeaderFormats';
import batchNumberSettingsSave from '@salesforce/label/c.batchNumberSettingsSave';
import batchNumberSettingsHeader from '@salesforce/label/c.batchNumberSettingsHeader';
import batchNumberSettingsDescriptionCreate
    from '@salesforce/label/c.batchNumberSettingsDescriptionCreate';
import batchNumberSettingsHeaderDisplayFormat
    from '@salesforce/label/c.batchNumberSettingsHeaderDisplayFormat';

const COLUMNS = [
    {fieldName: Display_Format.fieldApiName},
    {fieldName: IsActive.fieldApiName, type: 'boolean'},
    {fieldName: Description.fieldApiName, type: 'text'},
    {fieldName: Max_Used_Number.fieldApiName, type: 'text'},
];

export default class geBatchNumberSettings extends LightningElement {
    displayFormat;
    startingNumber;
    description;

    columns;
    autoNumberRecords;
    autoNumberInfoData;

    error;
    get error() {
        return this.error.body.message;
    }

    labels = {
        header: batchNumberSettingsHeader,
        description: batchNumberSettingsDescription,
        headerConfigure: batchNumberSettingsConfigureHeader,
        descriptionConfigure: batchNumberSettingsDescriptionCreate,
        headerDisplayFormat: batchNumberSettingsHeaderDisplayFormat,
        descriptionDisplayFormat: batchNumberSettingsDescDisplayFormat,
        headerFormats: batchNumberSettingsHeaderFormats,
        descriptionActivation: batchNumberSettingsDescActivation,
        buttonSave: batchNumberSettingsSave
    }

    @wire(getObjectInfo, {objectApiName: AutoNumber.objectApiName})
    autoNumberInfo({data}) {
        if (data) {
            this.autoNumberInfoData = data;
            this.columns =
                this.getColumnsWithFieldLabels(COLUMNS, this.autoNumberInfoData)
                    .concat(this.actionsColumn);
        }
    }

    get actionsColumn() {
        return [{type: 'action', typeAttributes: {rowActions: this.getRowActions}}];
    }

    getRowActions(row, doneCallback) {
        const actions = [];
        if (row[IsActive.fieldApiName]) {
            actions.push({
                'label': commonDeactivate,
                'name': 'deactivate'
            });
        } else {
            actions.push({
                'label': commonActivate,
                'name': 'activate'
            });
        }
        doneCallback(actions);
    }

    getColumnsWithFieldLabels = (columns, objectInfoData) => {
        let columnsWithFieldLabelsApplied = JSON.parse(JSON.stringify(columns));
        columnsWithFieldLabelsApplied.forEach(column => {
            if (objectInfoData.fields[column.fieldName]) {
                column.label = objectInfoData.fields[column.fieldName].label;
            }
        });
        return columnsWithFieldLabelsApplied;
    }

    permissionEnabled;
    async connectedCallback() {
        await isSysAdmin()
            .then(response => {
                this.permissionEnabled = response;
            })
            .catch(error => this.error = error);

        if (this.permissionEnabled) {
            this.fetchAutoNumbers();
        }
    }

    isLoading;
    fetchAutoNumbers() {
        this.isLoading = true;
        getAutoNumbers()
            .then(response => {
                this.isLoading = false;
                this.autoNumberRecords = response;
            })
            .catch(error => this.error = error);
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'activate':
                activate({autoNumberId: row['Id']})
                    .then(() => this.fetchAutoNumbers())
                    .catch(error => this.error = error);
                break;
            case 'deactivate':
                deactivate({autoNumberId: row['Id']})
                    .then(() => this.fetchAutoNumbers())
                    .catch(error => this.error = error);
                break;
        }
    }

    handleCreateBatchNumber() {
        const fields = {};
        fields[Object_API_Name.fieldApiName] = DataImportBatch.objectApiName;
        fields[Field_API_Name.fieldApiName] = Batch_Number.fieldApiName;
        fields[Starting_Number.fieldApiName] = this.startingNumber;
        fields[Display_Format.fieldApiName] = this.displayFormat;
        fields[Description.fieldApiName] = this.description;

        const record = {
            apiName: AutoNumber.objectApiName,
            fields: fields
        }

        const anString = JSON.stringify(record);
        save({autoNumber: anString})
            .then(() => {
                this.error = null;
                this.fetchAutoNumbers();
            })
            .catch(error => {
                this.error = error;
            });
    }

    get errorMessage() {
        return this.error ? this.error.body.message : null;
    }

    handleStartingNumberChange(event) {
        this.startingNumber = event.target.value;
    }

    handleDescriptionChange(event) {
        this.description = event.target.value;
    }

    handleDisplayFormatBlur(event) {
        if (!this.isValidDisplayFormat(event.target.value)) {
            event.target.setCustomValidity('Invalid Display Number format.');
        } else {
            event.target.setCustomValidity('');
        }
        event.target.reportValidity();
    }

    isValidDisplayFormat(value) {
        const re = '.*\\{0*\\}';
        const regex = RegExp(re);
        return regex.test(value) &&
            value.match(/{/g).length === 1 &&
            value.match(/}/g).length === 1;
    }

    handleDisplayFormatChange(event) {
        this.displayFormat = event.target.value;
    }

    get displayNumberPlaceholder() {
        return '{000000} or BTC-{000000}';
    }

    // ================================================================================
    // Quality Assurance Locators
    // ================================================================================

    get qaLocatorDisplayFormat() {
        return `input ${this.labelDisplayFormat}`;
    }

    get qaLocatorStartingNumber() {
        return `input ${this.labelStartingNumber}`;
    }

    get qaLocatorDescription() {
        return `input ${this.labelDescription}`;
    }

    get qaLocatorCreateBatchNumberFormatButton() {
        return `button ${this.labels.buttonSave}`;
    }

    get qaLocatorBatchNumberDatatable() {
        return `datatable`;
    }

    get labelDisplayFormat() {
        return this.autoNumberInfoData ? this.autoNumberInfoData.fields.Display_Format__c.label : '';
    }

    get inlineHelpTextDisplayFormat() {
        return this.autoNumberInfoData ? this.autoNumberInfoData.fields.Display_Format__c.inlineHelpText : '';
    }

    get labelStartingNumber() {
        return this.autoNumberInfoData ? this.autoNumberInfoData.fields.Starting_Number__c.label : '';
    }

    get inlineHelpTextStartingNumber() {
        return this.autoNumberInfoData ? this.autoNumberInfoData.fields.Starting_Number__c.inlineHelpText : '';
    }

    get labelDescription() {
        return this.autoNumberInfoData ? this.autoNumberInfoData.fields.Description__c.label : '';
    }

    get inlineHelpTextDescription() {
        return this.autoNumberInfoData ? this.autoNumberInfoData.fields.Description__c.inlineHelpText : '';
    }

}
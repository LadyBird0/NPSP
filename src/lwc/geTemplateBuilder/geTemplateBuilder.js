import { LightningElement, track } from 'lwc';
import { FormTemplate, mutable } from 'c/utilTemplateBuilder';

export default class geTemplateBuilder extends LightningElement {
    @track activeTab;
    _previousTab;

    @track formTemplate = new FormTemplate();

    /* delete once all sections are their own components, currently only used by
    * matching logic tab */
    handleToggleClick(event) {
        this._previousTab = this.activeTab;
        this.activeTab = event.target.getAttribute('data-tab-value');
    }

    /*******************************************************************************
    * @description Lifecycle hook that gets called after every render of the component.
    * Need to reset the activeTab for lightning:tabset to rerender properly because
    * clicking on the individual lightning:tab components does not auto-update the
    * lightning:tabset active-tab-value property.
    */
    renderedCallback() {
        this.activeTab = undefined;
    }

    handleFormTemplateSave() {
        console.log('handleFormTemplateSave');
        const templateInfo = this.template.querySelector('c-ge-template-builder-template-info').getTabData();
        console.log('Template Info Tab: ', mutable(templateInfo));
        const batchHeader = this.template.querySelector('c-ge-template-builder-batch-header').getTabData();
        console.log('Batch Header Tab: ', mutable(batchHeader));
        const giftFields = this.template.querySelector('c-ge-template-builder-gift-fields').getTabData();
        console.log('Gift Fields Tab: ', mutable(giftFields));

        this.formTemplate.name = templateInfo.name;
        this.formTemplate.description = templateInfo.description;
        this.formTemplate.batchHeader = batchHeader;
        this.formTemplate.layout = {};
        this.formTemplate.layout.version = '1.0';
        this.formTemplate.layout.sections = giftFields;

        console.log('*************');
        console.log('FORM TEMPLATE');
        console.log('*************');

        console.log(mutable(this.formTemplate));
    }

    /*******************************************************************************
    * @description Handles previous and next tab navigation
    *
    * @param {object} event: Event received from child component
    */
    handleGoToTab(event) {
        this.activeTab = event.detail.tabValue;

        /*if (event.detail.tabData) {
            this.stashTabDetails(event.detail.tabData);
        }*/
    }

    /* Placeholder function to stash tab details (template info, selected batch header fields, etc)
    * into an object.
    */
    /*stashTabDetails(tabData) {
        //console.log(this.mutable(tabData));
        if (tabData.sourceTab === 'geTemplateBuilderTemplateInfo') {
            console.log('Stashing Template Info | geTemplateBuilderTemplateInfo');
            console.log('Form Template:::', this.formTemplate);
            this.formTemplate.name = tabData.name;
            this.formTemplate.description = tabData.description;
        } else if (tabData.sourceTab === 'geTemplateBuilderBatchHeader') {
            console.log('Stashing Template Info | hbeTemplateBuilderBatchHeader');
            this.formTemplate.batchHeader = tabData.batchFields;
        }

        console.log('Form Template: ', JSON.parse(JSON.stringify(this.formTemplate)));
    }*/
}
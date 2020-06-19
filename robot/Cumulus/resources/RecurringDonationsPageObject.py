from cumulusci.robotframework.pageobjects import ListingPage
from cumulusci.robotframework.pageobjects import DetailPage
from cumulusci.robotframework.pageobjects import pageobject
from cumulusci.robotframework.utils import capture_screenshot_on_error
from BaseObjects import BaseNPSPPage
from NPSP import npsp_lex_locators
from datetime import datetime
from dateutil.relativedelta import relativedelta

@pageobject("Listing", "npe03__Recurring_Donation__c")
class RDListingPage(BaseNPSPPage, ListingPage):
    object_name = "npe03__Recurring_Donation__c"



@pageobject("Details", "npe03__Recurring_Donation__c")
class RDDetailPage(BaseNPSPPage,DetailPage ):
    object_name = "npe03__Recurring_Donation__c"
    
    def _is_current_page(self):
        """ Verify we are on the Account detail page
            by verifying that the url contains '/view'
        """
        self.selenium.wait_until_location_contains("/view", timeout=60, message="Record view did not open in 1 min")
        self.selenium.location_should_contain("/lightning/r/npe03__Recurring_Donation__c/",message="Current page is not a Recurring Donations record view")
    
    def refresh_opportunities(self):
        """Clicks on more actions dropdown and click the given title"""
        locator=npsp_lex_locators['link-contains'].format("more actions")
        self.selenium.click_element(locator)
        self.selenium.wait_until_page_contains("Refresh Opportunities")
        link_locator=npsp_lex_locators['link'].format('Refresh_Opportunities','Refresh_Opportunities')
    
    def click_actions_button(self,button_name):
        """Clicks on action button based on API version"""
        if self.npsp.latest_api_version == 47.0:
            self.selenium.click_link(button_name)
        else:
            self.selenium.click_button(button_name)

    @capture_screenshot_on_error
    def edit_recurring_donation(self,**kwargs):
        """From the actions dropdown select edit action and edit the fields specified in the kwargs"""
        locator=npsp_lex_locators['bge']['button'].format("Edit")
        edit_button=self.selenium.get_webelement(locator)
        self.selenium.wait_until_page_contains_element(edit_button, error="Show more actions dropdown didn't open in 30 sec")
        self.selenium.click_element(locator)
        self.salesforce.wait_until_modal_is_open()
        self._populate_edit_rd_form(**kwargs)
        self.selenium.click_button("Save")
        self.salesforce.wait_until_modal_is_closed()

    @capture_screenshot_on_error
    def _populate_edit_rd_form(self, **kwargs):
        """Pass the field name and value as key, value pairs to populate the edit form"""
        for key, value in kwargs.items():
            if key == "Status":
                self.npsp.select_value_from_dropdown(key, value)
            else:
                self.npsp.populate_modal_form(**kwargs)

    @capture_screenshot_on_error
    def verify_schedule_warning_messages_present(self):
        """Verify that the schedule warning messages are present when there are no schedules"""
        message_locator = npsp_lex_locators['erd']['text_message']
        list_ele = self.selenium.get_webelements(message_locator)
        p_count = len(list_ele)
        if p_count == 2:
            return
        else:
            raise Exception("Schedule warning messages do not exist")

    @capture_screenshot_on_error
    def validate_field_values_under_section(self, section=None, **kwargs):
        """Based on the section name , navigates to the sections and validates the key. value pair values passed in kwargs.
         If the section is current schedule, waits for the Current schedule section card on the side bar
         Validates the display fields in the card match with the values passed in the key value pair"""
        
        if section == "Current Schedule":
            active_schedule_card = npsp_lex_locators["erd"]["active_schedules_card"].format(section)
            number_fields = ['Amount','Installment Frequency']
            date_fields =  ['Effective Date']
            self.selenium.wait_until_element_is_visible(active_schedule_card,60)
            for label, value in kwargs.items():
                if label in number_fields:
                    locator = npsp_lex_locators["erd"]["formatted_number"].format(label)
                    actual_value=self.selenium.get_webelement(locator).text
                elif label in date_fields:
                    locator = npsp_lex_locators["erd"]["formatted_date"].format(label)
                    actual_value=self.selenium.get_webelement(locator).text
                else:
                    locator = npsp_lex_locators["erd"]["formatted_text"].format(label)
                    actual_value=self.selenium.get_webelement(locator).text
                    
                    if self.npsp.check_if_element_exists(locator):
                        print(f"element exists {locator}")
                        actual_value=self.selenium.get_webelement(locator).text
                        print(f"actual value is {actual_value}")
                        self.builtin.log(f"actual value is {actual_value}")
                        assert value == actual_value, "Expected {} value to be {} but found {}".format(label,value, actual_value)
                    else:
                        self.builtin.log("element Not found")
        else:
            for label, value in kwargs.items():
                self.npsp.navigate_to_and_validate_field_value(label, "contains", value, section)
    
    
    
    @capture_screenshot_on_error
    def validate_upcoming_schedules(self, num_payments,startdate,dayofmonth):
        """Takes in the parameter (number of payments) and the donation start date
        verifies that the payment schedules created on UI reflect the total number
        verifies that the next payment dates are reflected correctly for all the schedules"""
        
        installmentrow = npsp_lex_locators["erd"]["installment_row"]
        installments = self.selenium.get_webelements(installmentrow)
        count = len(installments)
        print(f"Number of installments created is {count}")
        assert count == int(num_payments), "Expected installments to be {} but found {}".format(num_payments, count)
        if count == int(num_payments):
            i = 1
            while i < count:
                datefield = npsp_lex_locators["erd"]["installment_date"].format(i)
                installment_date = self.selenium.get_webelement(datefield)
                date_object = datetime.strptime(startdate, '%m/%d/%Y').date()
                expected_date = (date_object+relativedelta(months=+i)).replace(day=int(dayofmonth))
                actual_date=self.selenium.get_webelement(installment_date).text
                formatted_actual = datetime.strptime(actual_date, '%m/%d/%Y').date()
                assert formatted_actual == expected_date, "Expected date to be {} but found {}".format(expected_date,formatted_actual)
                i=i+1
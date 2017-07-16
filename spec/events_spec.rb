require 'support/search_helper.rb'

describe "events", type: :feature, js: true do
  include SearchHelper
  let(:address) { '441 North Milwaukee Avenue, Chicago, IL, United States' }

  describe "click search button" do
    it 'shows a map' do
      do_search(address)
      find('#btnViewMode', match: :first).click
      expect(page).to have_selector('#mapCanvas', visible: true)
    end

    it 'adds a pushpin' do
      do_search(address)
      find('#btnViewMode', match: :first).click
      sleep(1)
      expect(page).to have_xpath('//img[@src="/img/blue-pushpin.png"]')
    end

    it 'updates the results' do
      do_search(address)
      find('#btnViewMode', match: :first).click
      expect(find('.results-count').text).to end_with 'locations found'
    end

    it 'updates the info div' do
      do_search(address)
      find('#btnViewMode', match: :first).click
      expect(find('.info').text).to eq('Hover over a location')
    end
  end

  describe "click mode view button" do
    it 'shows a list' do
      do_search(address)
      expect(page).to have_selector('#listCanvas', visible: true)
    end

    it 'shows result count' do
      visit '/'
      expect(find('#search-header').text).to end_with 'search results in Illinois for all categories'
    end

    it 'shows filter description' do
      visit '/'
      expect(page).to have_selector('#btnViewMode')
      find('#filters label.control', match: :first).click
      find("#btnSearch", match: :first).click
      sleep(1)
      expect(find('#search-header').text).to end_with 'search results in Illinois for Re-entry'
    end

    it 'shows filtered address description' do
      do_search(address)
      sleep(1)
      expect(find('#search-header').text).to end_with 'search results within 5 miles of 441 North Milwaukee Avenue, Chicago for all categories'
    end

    it 'filters with multiple categories' do
      visit '/'
      expect(page).to have_selector('#btnViewMode')
      find('#filters .control', match: :first).click
      find('#filters .control:nth-child(2)', match: :first).click
      find("#btnSearch", match: :first).click
      sleep(1)
      expect(find('#search-header').text).to end_with 'search results in Illinois for Re-entry, Housing'
    end

    it 'show restrictions in description' do
      visit '/'
      expect(page).to have_selector('#btnViewMode')
      find('#filters .control:first-child', match: :first).click
      find('#filters .control:last-child', match: :first).click
      find("#btnSearch", match: :first).click
      sleep(1)
      expect(find('#search-header').text).to end_with 'search results in Illinois for Re-entry not including Women only'
    end
  end

  describe "click save search button" do
    it "adds an item to nav bar" do
      do_search(address)
      find("#btnSave", match: :first).click
      expect(page).to have_selector('#dropdown-results', visible: true)
    end

    it "adds a list item to dropdown menu" do
      visit '/'
      sleep(1)
      find("#btnSave", match: :first).click
      sleep(1)
      find(".dropdown-toggle", match: :first).click
      searches = Array.new
      searches = find('.saved-searches').all('li')
      original_list = searches.length
      # Do another search with new address.
      do_search('432 North Clark Street, Chicago, IL, United States')
      find("#btnSave", match: :first).click
      find(".dropdown-toggle", match: :first).click
      searches_redux = Array.new
      searches_redux = find('.saved-searches').all('li')
      expect(searches_redux.length - original_list).to eq(1)
    end
  end

  describe "click reset" do
    it "resets the page" do
      do_search(address)
      find("#btnReset", match: :first).click
      uri = URI.parse(current_url)
      expect("#{uri.path}?#{uri.query}").to eq("/?")
    end
  end

  describe "save facility" do
    it "adds an element to nav bar" do
      visit '/'
      sleep(1)
      find("td.hidden-xs .icon-star-o", match: :first).click
      sleep(1)
      expect(page).to have_selector("#saved-locations", visible: true)
    end

    it "changes the icon to a circle" do
      do_search(address)
      find(".icon-star-o", match: :first).click
      expect(page).to have_selector(".icon-star", visible: true)
    end
  end

  describe "click on list content" do
    it "creates a modal pop-up" do
      visit '/'
      sleep(1)
      find('span.facility-name', match: :first).click
      sleep(1)
      expect(page).to have_selector('#modal-pop', visible: true)
    end
  end

end

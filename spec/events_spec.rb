require 'support/search_helper.rb'

describe "events", type: :feature, js: true do
  include SearchHelper

  describe "click search button" do
    it 'adds a pushpin' do
      do_search
      # binding.pry # test will pause here
      expect(page).to have_xpath('//img[@src="/img/blue-pushpin.png"]')
    end

    it 'updates the results' do
      do_search
      expect(find('.results-count').text).to eq('Results: 1')
    end

    it 'updates the info div' do
      do_search
      expect(find('.info').text).to eq('Hover over a location')
    end
  end

  describe "click mode view button" do
    it 'shows a list' do
      do_search
      find('#btnViewMode', match: :first).click
      expect(page).to have_selector('#listCanvas', visible: true)
    end

    it 'shows a map' do
      do_search
      find('#btnViewMode', match: :first).click
      find('#btnViewMode', match: :first).click
      expect(page).to have_selector('#mapCanvas', visible: true)
    end
  end

  describe "click save search button" do
    it "add a list item to dropdown menu" do
      visit '/'
      expect(page).to have_selector('#dropdown-results')
      find(".dropdown-toggle", match: :first).click
      searches = Array.new
      searches = find('.saved-searches').all('li')
      original_list = searches.length
      do_search
      find("#btnSave", match: :first).click
      find(".dropdown-toggle", match: :first).click
      searches_redux = Array.new
      searches_redux = find('.saved-searches').all('li')
      expect(searches_redux.length - original_list).to eq(1)
    end
  end

  describe "click remove icon" do
    it "deletes a list item from the dropdown menu" do
      visit '/'
      do_search
      find("#btnSave", match: :first).click
      find(".dropdown-toggle", match: :first).click
      searches_redux = Array.new
      searches_redux = find('.saved-searches').all('li')
      original_list = searches_redux.length
      find(".dropdown-toggle", match: :first).click
      find("#dropdown-results", match: :first).click
    end
  end

end
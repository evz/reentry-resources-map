describe "page", type: :feature, js: true do

  describe "wizard page navbar" do
    before(:each) { visit '/' }

    it "has a Results link" do
      expect(find('#navbar ul li:first-child').text).to eq('Results')
    end

  end

  describe "results page navbar" do
    before(:each) { visit '/results' }

    it "has a page title" do
      expect(find('.navbar-brand').text).to eq('Illinois Re-Entry Resources')
    end

    it "has a Download Guide" do
      expect(find('#navbar ul li:nth-child(4)').text).to eq('Download Guide')
    end

    it "has an About" do
      expect(find('#navbar ul li:nth-child(5)').text).to eq('About')
    end

    it "has an Add resource" do
      expect(find('#navbar ul li:nth-child(6)').text).to eq('Add resource')
    end
  end

  describe "map canvas" do
    before(:each) {
      visit '/results'
      find('#btnViewMode', match: :first).click
    }

    it "has a results div" do
      expect(page).to have_selector('.results-count', visible: true)
    end

    it "has an info div" do
      expect(page).to have_selector('.results-count', visible: true)
    end
  end

end

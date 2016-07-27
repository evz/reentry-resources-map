describe "page", type: :feature, js: true do

  describe "navbar" do

    before(:each) do
      visit '/'
    end

    it "has a page title" do
      # binding.pry # test will pause here
      expect(find('.navbar-brand').text).to eq('Probation Resources Map')
    end

    it "has an About" do
      expect(find('#navbar ul li:nth-child(2)').text).to eq('About')
    end

    it "has a Contribute" do
      expect(find('#navbar ul li:nth-child(3)').text).to eq('Contribute')
    end
  end

  describe "map canvas" do
    it "has a results div" do
      visit '/'
      expect(page).to have_selector('.results-count', visible: true)
    end


  end

end
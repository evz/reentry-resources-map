var WIZARD_STEPS = [
    {
        title: 'Tell us what you’re looking for.',
        questions: [
            {
                text: 'Thinking of the person for whom you are finding resources, ' +
                    'select all of the options that describe what that person is looking ' +
                    'for. We will filter the list to show you only programs related to what ' +
                    'you select.',
                help_text: 'The person is looking for',
                checked_val: 'true',
                param: 'type',
                checkbox: [
                    { value: 'housing', text: 'A place to live or immediate shelter' },
                    { value: 'food', text: 'Help with meals or groceries' },
                    { value: 'employment', text: 'Job training or help finding a job' },
                    { value: 'health', text: 'Medical services, counseling, or wants help with addiction' },
                    { value: 'advocacy', text: 'Groups that advocate for incarcerated people' },
                    { value: 'legal', text: 'Legal assistance' }
                ]
            },
            {
                text: 'Is this person currently incarcerated?',
                help_text: 'We can show you programs that serve incarcerated people and their families.',
                param: 'currently_incarcerated',
                radio: [
                    { value: 'true', text: 'Yes' },
                    { value: 'false', text: 'No' }
                ]
            }
        ]
    },
    {
        title: 'Tell us where you\'re looking',
        questions: [
            {
                text: 'Do you want to see resources that are close to a certain address? If so, enter it below.',
                help_text: 'For example, we can show you resources that are close to your home.',
                param: 'address',
                address: 'search-address'
            }
        ]
    },
    {
        title: 'Tell us a little more about the person who is looking for resources.',
        questions: [
            {
                text: 'Thinking of the person for whom you are finding resources, ' + 
                    'select all of the options below that accurately describe that person. ' +
                    'We can filter the list to show programs and resources that will apply.',
                help_text: 'This person',
                checked_val: 'null',
                param: 'type',
                checkbox: [
                    { value: 'is_parent', text: 'Is a parent' },
                    { value: 'veterans', text: 'Is a veteran' },
                    { value: 'immigrant', text: 'Is an immigrant' },
                    { value: 'women_only', text: 'Is a man' },
                    { value: 'men_only', text: 'Is a woman' }
                ]
            }
        ]
    }
];

function nextStep() {
    var currentStep = $(".step:visible");
    var nextStep = $(".step[data-step='" + (currentStep.data("step")+1) + "']");
    currentStep.hide();
    nextStep.show();
    $(".progress-line").css("width", (((nextStep.data("step") + 1) / WIZARD_STEPS.length) * 100) + '%');
}

function previousStep() {
    var currentStep = $(".step:visible");
    var previousStep = $(".step[data-step='" + (currentStep.data("step")-1) + "']");
    currentStep.hide();
    previousStep.show();
    $(".progress-line").css("width", (((previousStep.data("step") + 1) / WIZARD_STEPS.length) * 100) + '%');
}

(function() {
    var source = $('#wizard-template').html();
    var template = Handlebars.compile(source);
    var result = template(WIZARD_STEPS);
    $('#wizard').html(result);
    $("#wizard .step:first-child").show();
    $(".progress-line").css("width", ((1 / WIZARD_STEPS.length) * 100) + '%');
    $(".step .next-btn").on("click", nextStep);
    $(".step .previous-btn").on("click", previousStep);
    var autocomplete = new google.maps.places.Autocomplete(document.getElementById('search-address'));
})()
module.exports = {


    friendlyName: 'Test me',
  
  
    description: 'Display "TEST" page.',
  
  
    exits: {
  
      success: {
        viewTemplatePath: 'test'
      }
      
  
    },
  
  
    fn: async function () {
  
      // Respond with view.
      return {};
  
    }
  
  
  };
  
/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 * You will need to enter your web site address (function: GetWebURL()) 
 * and API-SECRET key (function: GetSecretKey()) (see "TODO places")
 */


// Version 0.3

var UI = require('ui');
var ajax = require('ajax');
var integer_part = 0;
var fractional_part = 0;
var carbs_name = "Carbs";
var insulin_name ="Insulin";

 var main = new UI.Menu(
   {
    sections: [{
      items: [{
        title: carbs_name,
      }, {
        title: insulin_name,
      }]
    }]
  });

  main.show();

  function GetUnits(name)
  {
     if(name == carbs_name)
     {
          return "g";
     }
      else if(name == insulin_name)
        {
           return "units";
        }
    else
      {
        return "";
      }
    
  }

  function GetTitle(name, currentinteger, currentfractional)
  {
      var title = name +": " + currentinteger;
      
      if(name != carbs_name)
        {
            title +="." + currentfractional;
        }
      
      title += " " + GetUnits(name);
      
      return title;
  }

  function ResetValues()
  {
      console.log("Reseting data....");
      integer_part = 0;
      fractional_part = 0;
  }

  function GetIncrement(name, integerpart_set)
  {
      if(name == carbs_name)
        {
          return 1.0;
        }
      else if(name == insulin_name)
        {
          if(!integerpart_set)
            {
              return 1;
            }
            else
            {
              return 1;// 0.05 0.05, 0.1, 0.15
            } 
        }
      
      return 1;
  }
   
  function UpdateValues(name, integerpart_set, sign)
  {
      var increment = GetIncrement(name,integerpart_set) * sign;
  
      if(!integerpart_set)
      {
          integer_part = integer_part + increment;
          console.log("Updating integer_part");
          
        // negative numbers not allowed
          if(integer_part < 0)
             integer_part = 0;
        
      }
      else 
      {
          var constant = 10;
          fractional_part = fractional_part + increment;
          if(fractional_part == constant || fractional_part > constant)
          {
            console.log("Reset fractional_part > constant");
            fractional_part = fractional_part - constant;
            integer_part = integer_part + 1;
          }
        
        // negative numbers not allowed
          if(fractional_part < 0)
            fractional_part = 0;
  
          console.log("Updating fractional_part");
      }
  }

  function MongoDBContents(name, enteredby)
  {
    var contents = {
      "enteredBy" : enteredby,
      "eventType" : "Note"
      
    };
    contents[name.toLowerCase()] = integer_part + "." + fractional_part;
    return contents;
  }
 
  function GetEnteredBy()
  {
      return "Pebble";
  }  
  
  function GetWebURL()
  {
    // TODO: NEED TO SET THE WEB SITE NAME E.G https://yourwwebsitename.azurewebsites.net//api//v1//treatments//
     return 'https://yourwwebsitename.azurewebsites.net//api//v1//treatments//';
  }

  function GetSecretKey()
  {
    // TODO: Go to  http://www.sha1-online.com/ and enter your api-secret key and generate the hashed value e.g APISECRETKEY123 == a3bb4e29e4d74b0be1a2a4c360afc97a898782c5
    return "a3bb4e29e4d74b0be1a2a4c360afc97a898782c5"; 
  }

function PostTreatment(name)
  {
    var weburl = GetWebURL();
    var secret_key = GetSecretKey();
    var enteredby = GetEnteredBy();
    var contents = MongoDBContents(name, enteredby);

    console.log('Posting Treatment log');
     ajax(
        {
          url: weburl,
          method: 'POST',
          type: 'json',
          crossDomain: true,
          data: contents,
         headers: {
                      'API-SECRET' : secret_key
                   }
        }, 
         function(result) {
           console.log('Success and Result is: ' + result);
        },
        function(error) {
          console.log('The ajax request failed: ' + error);
        } 
       );
  }

function CommitMessage(main,contents, name)
{
            var senttocareportal = false;
           // Ui Card only "Select" and "Back" 
            var message = "You are adding '" + GetTitle(name, integer_part, fractional_part)  + "' to  Care Portal";
            var confirmmessage = new UI.Card({ title:message });
            confirmmessage.show();    
            confirmmessage.on('click', 'select', function(e)
            {
              senttocareportal = true;
              console.log("write info to mongo db.");
              PostTreatment(name);
              ResetValues();
              confirmmessage.hide();
              contents.hide();
              main.show();
            });
  
  
}
  main.on('select', function(e) 
  {
    var name =e.item.title;
    var  integerpart_set = false;
    
    var currenttitle = GetTitle(name, integer_part, fractional_part);
    
    var contents = new UI.Card({ title:currenttitle });
    contents.show();    

    contents.on('click', 'up', function(e)
    {
      console.log("currentvalue of integerpart_set: " + integerpart_set);
      UpdateValues(name, integerpart_set, 1);
      console.log("integer_part: " + integer_part + " fractional_part:" + fractional_part);
      
      contents.title(GetTitle(name, integer_part, fractional_part));
    });
    
    contents.on('click', 'down', function(e)
    {
      console.log("currentvalue of integerpart_set: " + integerpart_set);
      UpdateValues(name,integerpart_set, -1);
      console.log("integer_part: " + integer_part + " fractional_part:" + fractional_part);
 
      contents.title(GetTitle(name, integer_part, fractional_part));
    });
   
    contents.on('click', 'select', function(e)
    {
       if(!integerpart_set && name != carbs_name)
       {
          integerpart_set = true;     
       }
       else
       {
            CommitMessage(main, contents, name);
           integerpart_set = false;
       }
    });
    contents.on('click', 'back', function(e)
    {
      ResetValues();
      contents.hide();
    });
 
  });




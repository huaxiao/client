
/**
 * Class is a meta-factory function to create classes in JavaScript. It is a
 * shortcut for the CreateJS syntax style. By default, the class created by 
 * this function have an initialize function (the constructor). Optionally, you
 * can specify the inheritance by passing another class as parameter.
 *
 * By default, all classes created using this function, may receives only a
 * settings parameter as argument. This pattern is commonly used by jQuery and 
 * its plugins.
 *
 * Usage
 * -----
 *
 *     // Creating a simple class
 *     var BaseClass = Class();
 *
 *     // Using inheritance
 *     var ChildClass = Class(BaseClass);
 *
 *     // Defining the constructor
 *     ChildClass.prototype.ctor = function(params) { ... }
 *
 * @method Class
 * @param {Object} [baseClass] The super class.
 * @return {Object} A new class.
**/
(function(){
    Class = function (baseClass) {
        //create a new class
        // var cls = function(...params){
        //     this.ctor(...params);
        // };
        var cls = function(){
            this.ctor.apply(this,arguments);
        }

        //if base class is provided, inherit
        if(baseClass){
            cls.prototype = Object.create(baseClass.prototype);
            cls.prototype.constructor = cls;
        }

        //create initialize if does not exist on baseClass
        if(!cls.prototype.ctor){
            cls.prototype.ctor = function(){};
        }

        return cls;
    };
})();
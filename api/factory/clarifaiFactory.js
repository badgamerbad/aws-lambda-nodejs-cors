"use strict";

const clarifai = require("clarifai");

const FOOD_DATA = require("./db/ingredients");

const clarifaiApp = new clarifai.App({
    apiKey: process.env.CLARIFAI_API_KEY,
});


// TODO add modelkey to env
const modelKey = 'bd367be194cf45149e75f01d59f77ba7';

const clarifaiFactory = {
    /**
     * @description get the ingredients of the uploaded and requested
     * file
     * @returns {error, ingredients}
     */
    getIngredients: async uploadedFileUrl => {
        let error, ingredients;

        let clarifaiIngredientsData = await clarifaiApp.models.predict(modelKey, uploadedFileUrl);
        if(clarifaiIngredientsData.error) {
            error = {
                statusCode = clarifaiIngredientsData.error.statusCode,
                message = clarifaiIngredientsData.error.message,
            }
        }
        else {
            let concepts = clarifaiIngredientsData['outputs'][0]['data']['concepts']
      
            let filteredIngredients = concepts.map(
                concept => {
                    let ingredient = FOOD_DATA.find(food => food.name === concept.name)
                    return {
                        ...concept,
                        ...ingredient,
                    }
                }
            );
            ingredients = filteredIngredients;
        }

        return {error, ingredients}
    },
}

module.exports = clarifaiFactory;
"use strict";

const clarifai = require("clarifai");

const foodDataDb = require("./db/ingredients");

const clarifaiApp = new clarifai.App({
    apiKey: process.env.CLARIFAI_API_KEY,
});

const modelId = process.env.CLARIFAI_MODEL_ID;

const clarifaiFactory = {
    /**
     * @description get the ingredients of the uploaded and requested
     * file
     * @returns {error, ingredients}
     */
    getIngredients: async uploadedFileUrl => {
        let error, ingredients;

        let clarifaiIngredientsData = await clarifaiApp.models.predict(modelId, uploadedFileUrl);
        if(clarifaiIngredientsData && clarifaiIngredientsData.status && clarifaiIngredientsData.status.code === 10000) {
            let concepts = clarifaiIngredientsData['outputs'][0]['data']['concepts'];
      
            let filteredIngredients = concepts.map(
                concept => {
                    let ingredient = foodDataDb.find(food => food.name === concept.name)
                    return {
                        ...concept,
                        ...ingredient,
                    }
                }
            );
            ingredients = filteredIngredients;
        }
        else {
            let genericErrMessage = "Error fetching the clarifai API";
            error = {
                statusCode: 500,
                message: clarifaiIngredientsData ? clarifaiIngredientsData.status ? clarifaiIngredientsData.status.description : genericErrMessage : genericErrMessage,
            }
        }

        return {error, ingredients}
    },
}

module.exports = clarifaiFactory;
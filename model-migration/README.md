# Print Migration Tool

## Developing Model Migration

The model migration module works via a series of migration steps, which define a transformation for each Print Model version to the next.

### Creating new a migration step

#### Using migration utils to generate a new step
Run the following command to generate a new template step with the generated model interface and transform function:

```bash
pnpm generate-step 
```
You can then adjust the generated step's transform function to implement a new migration.

Run the following command to generate schemas from the model interface if it does not exist, for each step:

```bash
pnpm generate-schema
```

Schemas are required for migration steps to prove correctness of migrated Print Models via the type system.

## Using the Model Migration Tool

### API
Use api `PrintMigrationTool.migrate` to migrate print models to the latest migration version.

### CLI
Run the following command to migrate print models to the latest migration version

> node ./src/main/bin/print-model-migration.cjs <print-models-folder-path>

Adjust the path to print-model-migration.cjs based on your setup, and replace <print-models-folder-path> with the location of your print models.







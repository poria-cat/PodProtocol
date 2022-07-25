import { parse } from "graphql";

function getValueName(name) {
  return { kind: name.kind, value: name.value };
}
function getDefaultValue(directives) {
  // return {haveDefaultValue, value}

  let haveDefaultValue = false;

  const defaultDirectives = directives.filter((directive) => {
    const name = directive.name;

    const directiveKind = name.kind; // Name
    const directiveValue = name.value; // default

    if (directiveKind === "Name" && directiveValue === "default") {
      return true;
    }
    return false;
  });

  if (defaultDirectives.length !== 1) {
    return { haveDefaultValue, value: null };
  }

  const directiveArguments = defaultDirectives[0].arguments;

  if (directiveArguments.length !== 1) {
    return { haveDefaultValue, value: null };
  }

  const arg = directiveArguments[0];

  const keyKind = arg.name.kind; // "Name"
  const keyValue = arg.name.value; // "value"

  const valueKind = arg.value.kind; // "StringValue"
  const valueValue = arg.value.value;

  if (
    !(keyKind === "Name" && keyValue === "value" && valueKind === "StringValue")
  ) {
    return { haveDefaultValue, value: null };
  }

  haveDefaultValue = true;
  return { haveDefaultValue, value: valueValue };
}

export function parseSchema(schema) {
  const parsed = parse(schema);
  const models = {};
  parsed.definitions.forEach((definition) => {
    const name = definition.name;
    if (name.kind === "Name") {
      const modelName = name.value;
      models[modelName] = {};
      const fields = definition.fields;
      fields.forEach((field) => {
        const name = field.name;
        if (name.kind === "Name") {
          // console.log({modelName})
          const attributeName = name.value;
          models[modelName][attributeName] = {};

          const valueKind = field.type.kind;
          if (valueKind === "NamedType" || valueKind === "NonNullType") {
            let typeKind = null;
            let typeValue = null;

            if (!field.type.type) {
              typeKind = getValueName(field.type.name).kind;
              typeValue = getValueName(field.type.name).value;
            } else {
              typeKind = getValueName(field.type.type.name).kind;
              typeValue = getValueName(field.type.type.name).value;
            }

            if (typeKind === "Name") {
              const allowTypes = ["String", "ID", "Int", "Float", "Boolean"];
              if (!allowTypes.includes(typeValue)) {
                throw `not support type ${typeValue} in entity ${modelName}`;
              }

              models[modelName][attributeName]["type"] = typeValue;
              valueKind === "NonNullType"
                ? (models[modelName][attributeName]["allowNull"] = false)
                : null;

              const directives = field.directives;
              const defaultValue = getDefaultValue(directives);
              if (defaultValue.haveDefaultValue) {
                models[modelName][attributeName]["defaultValue"] =
                  defaultValue.value;
              }
            }
          }
        }
      });
    }
  });
  return models;
}

export function checkId(parsedSchema) {
  for (const entityName in parsedSchema) {
    const entity = parsedSchema[entityName];
    let id = entity.id;
    if (!id) {
      throw `expect ${entityName} have id attribute, but can't find it`;
    }
    if (id.allowNull) {
      throw `id can't be empty, but ${entityName}'s id allow null`;
    }
  }
}

import { ActorRdfFrame, IActionRdfFrame, IActorRdfFrameOutput } from '@treecg/bus-rdf-frame';
import {Actor, IActorArgs, IActorTest, Mediator} from "@comunica/core";

import type {
  IActionSparqlSerializeHandle,
  IActorOutputSparqlSerializeHandle,
  IActorTestSparqlSerializeHandle,
} from '@comunica/bus-sparql-serialize';

import type {
  IActorQueryOperationOutputQuads,
} from '@comunica/bus-query-operation';

import * as jsonld from 'jsonld';
import {ContextDefinition, JsonLdDocument} from "jsonld/jsonld";
const stringifyStream = require('stream-to-string');

/**
 * A comunica RDF Frame Actor that creates a JSON-LD object from a quad stream using framing and compaction
 */
export class ActorRdfFrameWithJSONLDjs extends ActorRdfFrame {

  public readonly mediatorRdfSerialize: Mediator<Actor<IActionSparqlSerializeHandle, IActorTestSparqlSerializeHandle, IActorOutputSparqlSerializeHandle>,
      IActionSparqlSerializeHandle, IActorTestSparqlSerializeHandle, IActorOutputSparqlSerializeHandle>;

  public constructor(args: IActorArgs<IActionRdfFrame, IActorTest, IActorRdfFrameOutput>) {
    super(args);
  }

  public async test(action: IActionRdfFrame): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async run(action: IActionRdfFrame): Promise<IActorRdfFrameOutput> {
    // Serialize quad stream into JSON-LD object
    const handle: IActorQueryOperationOutputQuads = {
        type: "quads",
        quadStream: action.data
     };
    let obj: JsonLdDocument = JSON.parse(await stringifyStream((await this.mediatorRdfSerialize.mediate({handle: handle, handleMediaType: "application/ld+json"})).handle.data));

    // Frame the JSON-LD object
    const framed = await jsonld.frame(obj, action.frame);

    // Fetch JSON-LD context for compaction
    const context : ContextDefinition = action.jsonLdContext ? action.jsonLdContext : {"@context": {}};
    const compacted = await jsonld.compact(framed, context);

    const output : IActorRdfFrameOutput = {
      data: compacted
    }

    return output;
  }
}

export interface IActorRdfFrameWithJSONLDjsArgs extends IActorArgs<IActionRdfFrame, IActorTest, IActorRdfFrameOutput> {
  mediatorRdfSerialize: Mediator<
      Actor<IActionSparqlSerializeHandle, IActorTestSparqlSerializeHandle, IActorOutputSparqlSerializeHandle>,
      IActionSparqlSerializeHandle, IActorTestSparqlSerializeHandle, IActorOutputSparqlSerializeHandle>;
}

const Tc = require('tcomb')
const { pull } = require('inu')
const { assign } = require('lodash')
const pullThrough = require('pull-through')
const pullMany = require('pull-many')

const Model = require('../types/model')
const Action = require('../types/action')
const See = require('../actions/see')
const Propose = require('../actions/propose')
const Id = require('../types/id')

const Agent = Tc.struct({
  id: Id
}, 'Agent')

Agent.prototype.run = function (sources) {
  const { id } = this

  return pullMany([
    // execute proposals
    pull(
      sources.actions(),
      pull.filter(action => Propose.is(action)),
      pull.map(proposal => {
        const { action } = proposal
        const ActionType = Action.dispatch(action)
        return ActionType(assign({}, action, { id }))
      })
    ),
    // keep seeing agent position
    pull(
      sources.models(),
      pull.map(model => model.entities[id]),
      pull.map(agent => agent.position),
      difference(),
      pull.map(position => {
        return See({
          center: position
        })
      })
    )
  ])
}

module.exports = Agent

// TODO extract out into `pull-difference`
function difference () {
  var lastValue
  return pull.filter(function (value) {
    var condition = value !== lastValue
    lastValue = value
    return condition
  })
}

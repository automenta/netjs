/*
Advanced Distributed Learning (ADL) aka TinCan
    http://tincanapi.com
    http://tincanapi.wikispaces.com/ADL+Experience+API+Companion+Document

{
    "actor": "A",
    "verb": "V",
    "object": "O"
}

http://adlnet.gov/expapi/verbs/*


experienced – to partake in an activity
A catch-all verb describing that a viewing, listening, reading, etc. took place within some form of activity. Examples include: reading a book, going to a baseball game, listening to music, etc.

attended – to formally experience an activity, likely one with multiple participants
A verb used to formally make the claim that an activity was experienced. Comparative with actors whom did not attend. Examples include: attending a Math class, attending a wedding, or attending a soccer match.

Attempted – to try to perform an activity with an inherent degree of success
A verb used to denote that an actor “tried” to perform an activity with a degree of success or failure. Examples include: a math examination, fixing a flat tire, or flight simulation

//continue HERE...

name
completed – to finish an activity in its entirety
String
display
{ "en-US" : "completed"}
Object
description
Used to indicate that something has been finished in its entirety. Things that are attempted but not completed should be assumed to be incomplete. Typically activities that are attempted should be able to be completed. Examples include: a math examination, fixing a flat tire, or the goal of riding a bicycle with no hands (objectType statement).
String

name
passed – to perform within in an activity to a satisfactory level
String
display
{ "en-US" : "passed"}
Object
description
Indicates if satisfaction of necessary requirements within the activity were met, an example would be a score exceeding a threshold/minimum score. Typically when an activity is passed, it is because it has been attempted. If completion is tracked on the activity, passing that activity should usually complete it as well. Examples include: a foreign language quiz, landing an airplane, or a certification.
String

name
failed – to perform within in an activity to an unsatisfactory level
String
display
{ "en-US" : "failed"}
Object
description
Indicates if satisfaction of necessary requirements within the activity were not met, an example would be a score not meeting a threshold/minimum score. Typically when an activity is failed, it is because it has been attempted. It is usually the case that a failed activity would need at least a second attempt to remove the failure. Examples include: a foreign language quiz, landing an airplane, or a certification.
String

name
answered – responded to a question
String
display
{ "en-US" : "answered"}
Object
description
Indicates the actor responded to a question. A question could originate from many sources – a formal exam, an interaction, another actor, or even as a response to another statement.
String

name
interacted – manipulated a control or interaction within an activity
String
display
{ "en-US" : "interacted"}
Object
description
A catch-all verb used to assert an actor’s manipulation of an object, physical or digital, in some context. Should be paired with a result corresponding to an input related to the type of the object. Could contain the resulting output of manipulation of the object. An example could be “interacted with lever with result pull and result “started the conveyor belt””


name
imported – copying of a resource making it available within another context
String
display
{ "en-US" : "imported"}
Object
description
The act of moving an object into another location or system. The activity or statement is the corresponding object, which will typically have a URI or statement identifier. Unless marked as “failed”, imports are assumed to be successful.
String


name
created – creation of a new resource
String
display
{ "en-US" : "created"}
Object
description
The act of generating a new resource or resources within an activity. Unless marked as “failed”, the action of creation is assumed to be successful.
String

name
shared – the authorization of an object to have access and permissions to an object owned by another actor
String
display
{ "en-US" : "shared"}
Object
description
Generic term indicating the intent to exchange an item of interest or the explicit changing of privacy. Could have a resulting permission object saying the level of access (read, write, owner, contributor, etc.) granted to the actor.
String
objectTypes
actor, activity
String[]



type
http://adlnet.gov/expapi/activities/course
String
typeDescription
A course typically represents a large amount of content intended to have multiple lessons or topics contained within modules or chapters.


type
http://adlnet.gov/expapi/activities/module
String
typeDescription
A module typically represents a large amount of content intended to have multiple lessons or topics, but is typically smaller than a course.


type
http://adlnet.gov/expapi/activities/meeting
String
typeDescription
A meeting is a gathering of multiple people for a common cause
String

type
http://adlnet.gov/expapi/activities/media
String
typeDescription
Media refers to text, audio, or video used to convey information

type
http://adlnet.gov/expapi/activities/performance
String
typeDescription
A performance is an attempted task or series of tasks within a particular context.


type
http://adlnet.gov/expapi/activities/simulation
String
typeDescription
A simulation is an attempted task or series of tasks in an artificial context that mimics reality.

type
http://adlnet.gov/expapi/activities/assessment
String
typeDescription
An assessment is an activity that determines a learner’s mastery of a particular subject area.

type
http://adlnet.gov/expapi/activities/interaction
String
typeDescription
An interaction is typically a part of a larger activity (such as assessment or simulation) and refers to a control to which a learner provides input.


type
http://adlnet.gov/expapi/activities/cmi.interaction
String
typeDescription
A cmi.interaction is a specific type of interaction, typically found in SCORM 2004, which expects specific interaction types and components.

type
http://adlnet.gov/expapi/activities/question
String
typeDescription
A question is typically part of an assessment and requires a response from the learner, a response that is then evaluated for correctness.


type
http://adlnet.gov/expapi/activities/objective
String
typeDescription
An objective determines whether competency has been achieved in a desired area.






*/
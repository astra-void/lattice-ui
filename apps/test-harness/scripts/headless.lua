local LogService = game:GetService("LogService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local STATUS_ATTRIBUTE = "TestHarnessStatus"
local FAILURE_ATTRIBUTE = "TestHarnessFailure"
local TIMEOUT_SECONDS = 120

local status = "running"
local failureMessage = ""

local function readStatusFromAttributes()
	local nextStatus = ReplicatedStorage:GetAttribute(STATUS_ATTRIBUTE)
	if type(nextStatus) == "string" and nextStatus ~= "" then
		status = nextStatus
	end

	local nextFailure = ReplicatedStorage:GetAttribute(FAILURE_ATTRIBUTE)
	if type(nextFailure) == "string" then
		failureMessage = nextFailure
	end
end

local messageConnection = LogService.MessageOut:Connect(function(message, messageType)
	if messageType == Enum.MessageType.MessageError and string.find(message, "[test-harness]", 1, true) ~= nil then
		status = "failed"
		if failureMessage == "" then
			failureMessage = message
		end
	end
end)

RunService:Run()

local startedAt = os.clock()
while status == "running" and os.clock() - startedAt < TIMEOUT_SECONDS do
	readStatusFromAttributes()
	task.wait(0.1)
end

readStatusFromAttributes()
RunService:Stop()
messageConnection:Disconnect()

if status == "passed" then
	return
end

if status == "failed" then
	error(string.format("[test-harness-headless] %s", failureMessage ~= "" and failureMessage or "Unknown failure"))
end

if failureMessage == "" then
	return
end

error(string.format("[test-harness-headless] Timed out after %d seconds waiting for TestEZ markers.", TIMEOUT_SECONDS))

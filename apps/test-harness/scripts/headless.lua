local LogService = game:GetService("LogService")
local RunService = game:GetService("RunService")

local PASS_MARKER = "[test-harness] TestEZ passed."
local FAIL_MARKER = "[test-harness] Failing run because"
local HARNESS_MARKER = "[test-harness]"
local TIMEOUT_SECONDS = 120

local status = "running"
local failureMessage = nil

local function hasMarker(message, marker)
	return string.find(message, marker, 1, true) ~= nil
end

local messageConnection = LogService.MessageOut:Connect(function(message, messageType)
	if hasMarker(message, PASS_MARKER) then
		status = "passed"
		return
	end

	if hasMarker(message, FAIL_MARKER) then
		status = "failed"
		failureMessage = message
		return
	end

	if messageType == Enum.MessageType.MessageError and hasMarker(message, HARNESS_MARKER) then
		status = "failed"
		failureMessage = message
	end
end)

RunService:Run()

local startedAt = os.clock()
while status == "running" and os.clock() - startedAt < TIMEOUT_SECONDS do
	task.wait(0.1)
end

RunService:Stop()
messageConnection:Disconnect()

if status == "passed" then
	return
end

if status == "failed" then
	error(string.format("[test-harness-headless] %s", failureMessage or "Unknown failure"))
end

error(string.format("[test-harness-headless] Timed out after %d seconds waiting for TestEZ markers.", TIMEOUT_SECONDS))
